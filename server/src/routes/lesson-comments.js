import { Router } from "express";
import { z } from "zod";
import { q } from "../db.js";
import { requireAuth } from "../auth.js";

const r = Router({ mergeParams: true });

const CommentIn = z.object({
  content: z.string().min(1).max(2000),
  kind: z.enum(["comment", "question"]).default("comment"),
  parentId: z.string().uuid().optional(),
});

const rowToItem = (row) => ({
  id: row.id,
  courseId: row.course_id,
  lessonIdx: row.lesson_idx,
  authorId: row.author_id,
  authorName: row.author_name,
  authorRole: row.author_role,
  kind: row.kind,
  content: row.content,
  parentId: row.parent_id,
  createdAt: row.created_at,
});

// GET 一节课的评论 / 讨论
r.get("/", async (req, res) => {
  const idx = parseInt(req.params.idx, 10);
  if (!Number.isFinite(idx) || idx < 0)
    return res.status(400).json({ error: "lesson idx 非法" });
  const { rows } = await q(
    `SELECT c.*, u.name AS author_name, u.role AS author_role
       FROM lesson_comments c
       JOIN users u ON u.id = c.author_id
      WHERE c.course_id=$1 AND c.lesson_idx=$2
      ORDER BY c.created_at ASC`,
    [req.params.id, idx],
  );
  res.json(rows.map(rowToItem));
});

// POST 新增评论；kind='question' 仅课程作者 / 讲师 / 管理员
r.post("/", requireAuth, async (req, res) => {
  const idx = parseInt(req.params.idx, 10);
  if (!Number.isFinite(idx) || idx < 0)
    return res.status(400).json({ error: "lesson idx 非法" });
  const p = CommentIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.message });

  const courseRow = await q("SELECT owner_id FROM courses WHERE id=$1", [req.params.id]);
  if (!courseRow.rowCount) return res.status(404).json({ error: "课程不存在" });

  const me = req.user;
  const isTeacher =
    me.role === "admin" ||
    me.role === "teacher" ||
    courseRow.rows[0].owner_id === me.sub;

  if (p.data.kind === "question" && !isTeacher)
    return res.status(403).json({ error: "只有讲师可以出题" });

  const ins = await q(
    `INSERT INTO lesson_comments(course_id,lesson_idx,author_id,kind,content,parent_id)
     VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.params.id, idx, me.sub, p.data.kind, p.data.content, p.data.parentId ?? null],
  );
  const withUser = await q(
    `SELECT c.*, u.name AS author_name, u.role AS author_role
       FROM lesson_comments c JOIN users u ON u.id=c.author_id
      WHERE c.id=$1`,
    [ins.rows[0].id],
  );
  res.json(rowToItem(withUser.rows[0]));
});

// DELETE 评论：作者本人 / 课程作者 / admin
r.delete("/:cid", requireAuth, async (req, res) => {
  const cRow = await q(
    `SELECT c.author_id, co.owner_id
       FROM lesson_comments c
       JOIN courses co ON co.id = c.course_id
      WHERE c.id=$1 AND c.course_id=$2`,
    [req.params.cid, req.params.id],
  );
  if (!cRow.rowCount) return res.json({ ok: true });
  const me = req.user;
  const row = cRow.rows[0];
  if (
    me.role !== "admin" &&
    row.author_id !== me.sub &&
    row.owner_id !== me.sub
  )
    return res.status(403).json({ error: "无权删除" });
  await q("DELETE FROM lesson_comments WHERE id=$1", [req.params.cid]);
  res.json({ ok: true });
});

export default r;