/**
 * 轻量人机验证客户端：服务端返回 428 时自动完成 PoW 挑战并换取通行证，
 * 之后的请求都带上 x-abuse-pass 头。全程无需用户操作。
 */
const PASS_KEY = "chaonao.abusePass";

let memPass: string | null = null;

export function getPass(): string | null {
  if (memPass) return memPass;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PASS_KEY);
    if (!raw) return null;
    const { pass, exp } = JSON.parse(raw) as { pass: string; exp: number };
    if (!pass || exp <= Date.now()) return null;
    memPass = pass;
    return pass;
  } catch {
    return null;
  }
}

function setPass(pass: string, exp: number) {
  memPass = pass;
  try {
    window.sessionStorage.setItem(PASS_KEY, JSON.stringify({ pass, exp }));
  } catch {}
}

type Challenge = { nonce: string; ts: number; difficulty: number; sig: string };

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 暴力搜索满足前导 0 的解，难度 4 时通常 < 1 秒 */
async function solve(c: Challenge, maxMs = 15_000): Promise<string> {
  const prefix = "0".repeat(c.difficulty);
  const started = Date.now();
  for (let i = 0; ; i++) {
    const hex = await sha256Hex(`${c.nonce}${i}`);
    if (hex.startsWith(prefix)) return String(i);
    if ((i & 0x3ff) === 0 && Date.now() - started > maxMs) throw new Error("人机验证超时，请稍后重试");
  }
}

let inflight: Promise<string> | null = null;

/** 完成挑战并返回通行证（并发调用会合并） */
export function solveChallenge(base: string, challenge?: Challenge): Promise<string> {
  if (inflight) return inflight;
  inflight = (async () => {
    let c = challenge;
    if (!c) {
      const res = await fetch(`${base}/api/challenge`);
      if (!res.ok) throw new Error("无法获取人机验证挑战");
      c = (await res.json()).challenge as Challenge;
    }
    const solution = await solve(c);
    const res = await fetch(`${base}/api/challenge/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, solution }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.pass) throw new Error(data.error || "人机验证失败");
    setPass(data.pass, data.expiresAt || Date.now() + 20 * 60_000);
    return data.pass as string;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}
