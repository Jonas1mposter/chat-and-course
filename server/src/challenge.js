/**
 * 轻量人机验证（无第三方依赖）：工作量证明（PoW）挑战。
 * 流程：疑似异常流量 -> 返回 428 + challenge -> 客户端算出 nonce -> 提交换取通行证(pass)
 * -> 后续请求带 x-abuse-pass 头，在封禁阈值前先放行。
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

export const CHALLENGE_CFG = {
  difficulty: num(process.env.CHALLENGE_DIFFICULTY, 3), // 前导 0 的十六进制位数
  ttlMs: num(process.env.CHALLENGE_TTL_SEC, 300) * 1000, // 挑战有效期
  passMs: num(process.env.CHALLENGE_PASS_MINUTES, 30) * 60_000, // 通行证有效期
};

const SECRET =
  process.env.CHALLENGE_SECRET || process.env.JWT_SECRET || randomBytes(32).toString("hex");

const sign = (data) => createHmac("sha256", SECRET).update(data).digest("hex");

const safeEq = (a, b) => {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && timingSafeEqual(x, y);
};

/** 生成一道挑战（无状态，签名自校验） */
export function issueChallenge(subject) {
  const nonce = randomBytes(12).toString("hex");
  const ts = Date.now();
  const { difficulty } = CHALLENGE_CFG;
  const payload = `${nonce}|${ts}|${difficulty}|${subject}`;
  return {
    type: "pow-sha256",
    nonce,
    ts,
    difficulty,
    sig: sign(payload),
    hint: "求 solution 使 sha256(nonce + solution) 的十六进制以 difficulty 个 0 开头",
  };
}

/** 校验解答并签发通行证 */
export function verifySolution({ nonce, ts, difficulty, sig, solution }, subject) {
  if (!nonce || !sig || solution === undefined || solution === null) {
    return { ok: false, error: "参数不完整" };
  }
  const d = Number(difficulty);
  if (!Number.isInteger(d) || d < 1 || d > 6) return { ok: false, error: "难度不合法" };
  if (!safeEq(sig, sign(`${nonce}|${ts}|${d}|${subject}`))) return { ok: false, error: "挑战无效" };
  if (Date.now() - Number(ts) > CHALLENGE_CFG.ttlMs) return { ok: false, error: "挑战已过期，请重试" };

  const hash = createHash("sha256").update(`${nonce}${solution}`).digest("hex");
  if (!hash.startsWith("0".repeat(d))) return { ok: false, error: "验证未通过" };

  const exp = Date.now() + CHALLENGE_CFG.passMs;
  return { ok: true, pass: `${exp}.${sign(`${subject}|${exp}`)}`, expiresAt: exp };
}

/** 校验请求头里的通行证 */
export function verifyPass(pass, subject) {
  if (!pass || typeof pass !== "string") return false;
  const [expStr, mac] = pass.split(".");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;
  return safeEq(mac, sign(`${subject}|${exp}`));
}
