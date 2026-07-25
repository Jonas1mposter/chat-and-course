import { Router } from "express";
import { randomBytes } from "crypto";
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth.js";

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

export default r;