import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { z } from "zod";
import { q } from "../db.js";
import { requireAuth, sign } from "../auth.js";
import { sendMail, resetCodeMail, mailerConfigured } from "../mailer.js";

const r = Router();

const CODE_TTL_MIN = 15;
const reqLog = (req) => ({
  ip: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || null,
  ua: (req.headers["user-agent"] || "").slice(0, 300),
});

export async function logReset({ userId, email, method, actor, success, detail, req }) {
  const { ip, ua } = reqLog(req);
  await q(
    `INSERT INTO password_reset_logs(user_id,email,method,actor_id,actor_email,success,detail,ip,user_agent)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      userId || null,
      email,
      method,
      actor?.sub || null,
      actor?.email || null,
      success !== false,
      detail || null,
      ip,
      ua,
    ],
  );
}

const RegisterIn = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(40),
  role: z.enum(["student", "teacher"]).optional(),
});

r.post("/register", async (req, res) => {
  const p = RegisterIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.message });
  const { email, password, name, role = "student" } = p.data;
  const exists = await q("SELECT 1 FROM users WHERE email=$1", [email]);
  if (exists.rowCount) return res.status(409).json({ error: "邮箱已注册" });
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await q(
    "INSERT INTO users(email,password_hash,name,role) VALUES($1,$2,$3,$4) RETURNING id,email,name,role",
    [email, hash, name, role],
  );
  const user = rows[0];
  res.json({ token: sign(user), user });
});

r.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "缺少参数" });
  const { rows } = await q(
    "SELECT id,email,name,role,password_hash FROM users WHERE email=$1",
    [email],
  );
  const u = rows[0];
  if (!u) return res.status(401).json({ error: "账号或密码错误" });
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ error: "账号或密码错误" });
  const user = { id: u.id, email: u.email, name: u.name, role: u.role };
  res.json({ token: sign(user), user });
});

r.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// 首装向导：全站尚无管理员时，把当前登录用户升级为 admin
r.post("/claim-admin", requireAuth, async (req, res) => {
  const has = await q("SELECT 1 FROM users WHERE role='admin' LIMIT 1");
  if (has.rowCount) return res.status(409).json({ error: "已有管理员，无法领取" });
  await q("UPDATE users SET role='admin' WHERE id=$1", [req.user.sub]);
  res.json({ ok: true });
});

r.get("/admin-exists", async (_req, res) => {
  const has = await q("SELECT 1 FROM users WHERE role='admin' LIMIT 1");
  res.json({ exists: !!has.rowCount });
});

// ============ 忘记密码：发送验证码 ============
r.post("/forgot-password", async (req, res) => {
  const p = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "邮箱格式不正确" });
  const email = p.data.email.trim().toLowerCase();
  const { ip } = reqLog(req);

  // 限流：同一邮箱 15 分钟内最多 3 次
  const recent = await q(
    `SELECT count(*)::int AS n FROM password_reset_codes
      WHERE email=$1 AND created_at > now() - interval '15 minutes'`,
    [email],
  );
  if (recent.rows[0].n >= 3)
    return res.status(429).json({ error: "请求过于频繁，请稍后再试" });

  const { rows } = await q("SELECT id,name FROM users WHERE lower(email)=$1", [email]);
  const user = rows[0];

  let delivered = false;
  if (user) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const hash = await bcrypt.hash(code, 10);
    await q("UPDATE password_reset_codes SET used_at=now() WHERE email=$1 AND used_at IS NULL", [email]);
    await q(
      `INSERT INTO password_reset_codes(email,code_hash,expires_at,ip)
       VALUES($1,$2, now() + ($3 || ' minutes')::interval, $4)`,
      [email, hash, String(CODE_TTL_MIN), ip],
    );
    const mail = resetCodeMail(code, CODE_TTL_MIN);
    try {
      const out = await sendMail({ to: email, ...mail });
      delivered = out.delivered;
    } catch (e) {
      console.error("[forgot-password] 邮件发送失败", e.message);
    }
    await logReset({
      userId: user.id,
      email,
      method: "request",
      success: true,
      detail: delivered ? "验证码已发送" : "邮件通道未配置，验证码仅记录在服务端日志",
      req,
    });
  }

  // 不暴露邮箱是否存在
  res.json({ ok: true, mailer: mailerConfigured() && delivered ? "sent" : "unavailable" });
});

// ============ 忘记密码：用验证码重设 ============
r.post("/reset-password", async (req, res) => {
  const p = z
    .object({
      email: z.string().email(),
      code: z.string().regex(/^\d{6}$/, "验证码为 6 位数字"),
      password: z.string().min(6, "密码至少 6 位"),
    })
    .safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
  const email = p.data.email.trim().toLowerCase();

  const { rows } = await q(
    `SELECT * FROM password_reset_codes
      WHERE email=$1 AND used_at IS NULL AND expires_at > now()
      ORDER BY created_at DESC LIMIT 1`,
    [email],
  );
  const rec = rows[0];
  if (!rec) return res.status(400).json({ error: "验证码不存在或已过期，请重新获取" });
  if (rec.attempts >= 5) return res.status(429).json({ error: "尝试次数过多，请重新获取验证码" });

  const ok = await bcrypt.compare(p.data.code, rec.code_hash);
  if (!ok) {
    await q("UPDATE password_reset_codes SET attempts=attempts+1 WHERE id=$1", [rec.id]);
    await logReset({ email, method: "self_code", success: false, detail: "验证码错误", req });
    return res.status(400).json({ error: "验证码错误" });
  }

  const u = await q("SELECT id,email,name,role FROM users WHERE lower(email)=$1", [email]);
  if (!u.rowCount) return res.status(400).json({ error: "账号不存在" });
  const hash = await bcrypt.hash(p.data.password, 10);
  await q("UPDATE users SET password_hash=$1 WHERE id=$2", [hash, u.rows[0].id]);
  await q("UPDATE password_reset_codes SET used_at=now() WHERE email=$1 AND used_at IS NULL", [email]);
  await logReset({ userId: u.rows[0].id, email, method: "self_code", success: true, detail: "用户自助重置成功", req });

  res.json({ ok: true, token: sign(u.rows[0]), user: u.rows[0] });
});

export default r;