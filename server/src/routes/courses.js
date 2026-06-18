import { Router } from "express";
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth.js";

const r = Router();

const CourseIn = z.object({
  id: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  description: z.string().default(""),
  instructor: z.string().default(""),
  level: z.enum(["入门", "进阶", "高级"]).default("入门"),
  duration: z.string().default(""),
  lessons: z.number().int().nonnegative().default(0),
  students: z.number().int().nonnegative().default(0),
  category: z.string().default(""),
  emoji: z.string().default("📘"),
  lessonsList: z
    .array(
      z.object({
        title: z.string(),
        duration: z.string(),
        videoUrl: z.string().optional(),
      }),
    )
    .default([]),
  published: z.boolean().default(false),
});

const rowToCourse = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  instructor: row.instructor,
  level: row.level,
  duration: row.duration,
  lessons: row.lessons,
  students: row.students,
  category: row.category,
  emoji: row.emoji,
  lessonsList: row.lessons_list,
  published: row.published,
});

// 列表：未登录只能看 published；登录后讲师/管理员可看自己的草稿
r.get("/", async (req, res) => {
  const me = req.user;
  let sql = "SELECT * FROM courses WHERE published = true";
  const params = [];
  if (me && (me.role === "admin" || me.role === "teacher")) {
    sql = "SELECT * FROM courses WHERE published = true OR owner_id = $1";
    params.push(me.sub);
  }
  if (me?.role === "admin") sql = "SELECT * FROM courses";
  const { rows } = await q(sql + " ORDER BY created_at DESC", params);
  res.json(rows.map(rowToCourse));
});

r.get("/:id", async (req, res) => {
  const { rows } = await q("SELECT * FROM courses WHERE id=$1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "课程不存在" });
  res.json(rowToCourse(rows[0]));
});

r.post("/", requireRole("teacher", "admin"), async (req, res) => {
  const p = CourseIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.message });
  const c = p.data;
  try {
    const { rows } = await q(
      `INSERT INTO courses(id,title,description,instructor,level,duration,lessons,students,category,emoji,lessons_list,published,owner_id)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        c.id, c.title, c.description, c.instructor, c.level, c.duration,
        c.lessons, c.students, c.category, c.emoji,
        JSON.stringify(c.lessonsList), c.published, req.user.sub,
      ],
    );
    res.json(rowToCourse(rows[0]));
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "课程 id 已存在" });
    throw e;
  }
});

r.put("/:id", requireRole("teacher", "admin"), async (req, res) => {
  const p = CourseIn.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.message });
  const existing = await q("SELECT owner_id FROM courses WHERE id=$1", [req.params.id]);
  if (!existing.rowCount) return res.status(404).json({ error: "课程不存在" });
  if (req.user.role !== "admin" && existing.rows[0].owner_id !== req.user.sub)
    return res.status(403).json({ error: "不能编辑别人的课程" });
  const fields = p.data;
  const sets = [];
  const vals = [];
  let i = 1;
  const map = {
    title: "title", description: "description", instructor: "instructor",
    level: "level", duration: "duration", lessons: "lessons",
    students: "students", category: "category", emoji: "emoji",
    published: "published",
  };
  for (const [k, col] of Object.entries(map)) {
    if (fields[k] !== undefined) { sets.push(`${col}=$${i++}`); vals.push(fields[k]); }
  }
  if (fields.lessonsList !== undefined) {
    sets.push(`lessons_list=$${i++}`); vals.push(JSON.stringify(fields.lessonsList));
  }
  sets.push(`updated_at=now()`);
  vals.push(req.params.id);
  const { rows } = await q(
    `UPDATE courses SET ${sets.join(",")} WHERE id=$${i} RETURNING *`,
    vals,
  );
  res.json(rowToCourse(rows[0]));
});

r.delete("/:id", requireRole("teacher", "admin"), async (req, res) => {
  const existing = await q("SELECT owner_id FROM courses WHERE id=$1", [req.params.id]);
  if (!existing.rowCount) return res.json({ ok: true });
  if (req.user.role !== "admin" && existing.rows[0].owner_id !== req.user.sub)
    return res.status(403).json({ error: "不能删除别人的课程" });
  await q("DELETE FROM courses WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

export default r;