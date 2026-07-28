import { Router } from "express";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth.js";
import { logReset } from "./auth.js";

const r = Router();

const GenIn = z.object({
  courseId: z.string().min(1),
  count: z.number().int().min(1).max(50).default(5),
  usesLeft: z.number().int().min(1).max(1000).default(1),
  expiresAt: z.string().datetime().optional().nullable(),
});

// 生成课程兑换码
r.post("/course-codes", requireRole("teacher", "admin"), async (req, res) => {
  const p = GenIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.message });
  const { courseId, count, usesLeft, expiresAt } = p.data;

  const own = await q("SELECT owner_id FROM courses WHERE id=$1", [courseId]);
  if (!own.rowCount) return res.status(404).json({ error: "课程不存在" });
  if (req.user.role !== "admin" && own.rows[0].owner_id !== req.user.sub)
    return res.status(403).json({ error: "不能给别人的课程发码" });

  const codes = [];
  for (let i = 0; i < count; i++) codes.push(randomBytes(4).toString("hex").toUpperCase());
  for (const c of codes) {
    await q(
      `INSERT INTO course_codes(code,course_id,uses_left,created_by,expires_at)
       VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
      [c, courseId, usesLeft, req.user.sub, expiresAt || null],
    );
  }
  res.json({ codes });
});

// 列出某课程未耗尽的兑换码
r.get("/course-codes/:courseId", requireRole("teacher", "admin"), async (req, res) => {
  const own = await q("SELECT owner_id FROM courses WHERE id=$1", [req.params.courseId]);
  if (!own.rowCount) return res.status(404).json({ error: "课程不存在" });
  if (req.user.role !== "admin" && own.rows[0].owner_id !== req.user.sub)
    return res.status(403).json({ error: "无权限" });
  const { rows } = await q(
    `SELECT code, uses_left, expires_at, created_at
       FROM course_codes WHERE course_id=$1 ORDER BY created_at DESC LIMIT 200`,
    [req.params.courseId],
  );
  res.json(rows);
});

// ============ 管理员重置用户密码 ============
const ResetIn = z.object({
  email: z.string().email().optional(),
  userId: z.string().uuid().optional(),
  password: z.string().min(6).optional(),
});

r.post("/reset-password", requireRole("admin"), async (req, res) => {
  const p = ResetIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "参数不合法（密码至少 6 位）" });
  const { email, userId, password } = p.data;
  if (!email && !userId) return res.status(400).json({ error: "请提供邮箱或用户 ID" });

  const { rows } = await q(
    userId
      ? "SELECT id,email,name FROM users WHERE id=$1"
      : "SELECT id,email,name FROM users WHERE lower(email)=lower($1)",
    [userId || email],
  );
  const u = rows[0];
  if (!u) return res.status(404).json({ error: "用户不存在" });

  const temp = password || randomBytes(6).toString("base64url");
  await q("UPDATE users SET password_hash=$1 WHERE id=$2", [await bcrypt.hash(temp, 10), u.id]);
  await q("UPDATE password_reset_codes SET used_at=now() WHERE lower(email)=lower($1) AND used_at IS NULL", [u.email]);
  await logReset({
    userId: u.id,
    email: u.email,
    method: "admin",
    actor: req.user,
    success: true,
    detail: password ? "管理员指定了新密码" : "管理员生成了临时密码",
    req,
  });

  res.json({ ok: true, user: { id: u.id, email: u.email, name: u.name }, password: temp });
});

// ============ 重置日志 ============
r.get("/password-reset-logs", requireRole("admin"), async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const { rows } = await q(
    `SELECT l.id, l.email, l.method, l.actor_email, l.success, l.detail, l.ip, l.created_at,
            u.name AS user_name
       FROM password_reset_logs l
       LEFT JOIN users u ON u.id = l.user_id
      ORDER BY l.created_at DESC LIMIT $1`,
    [limit],
  );
  res.json(rows);
});

export default r;