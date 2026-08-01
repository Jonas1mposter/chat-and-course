import { Router } from "express";
import { z } from "zod";
import { q } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

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
  emoji: z.string().default(""),
  lessonsList: z
    .array(
      z.object({
        title: z.string(),
        duration: z.string(),
        videoUrl: z.string().optional(),
        attachments: z
          .array(
            z.object({
              name: z.string(),
              url: z.string(),
              sizeBytes: z.number().optional(),
            }),
          )
          .optional()
          .default([]),
      }),
    )
    .default([]),
  published: z.boolean().default(false),
  requiresCode:   z.boolean().default(false),
  previewLessons: z.number().int().min(0).max(999).default(1),
  coverUrl:       z.string().default(""),
});

const rowToCourse = (row, opts = {}) => {
  const { enrolled = false, canEditAll = false } = opts;
  const preview = row.preview_lessons ?? 1;
  const list = Array.isArray(row.lessons_list) ? row.lessons_list : [];
  const filtered = list.map((l, i) => {
    if (enrolled || canEditAll) return l;
    // 未加入：只把前 preview 节的 videoUrl 返回，其余去掉
    if (i < preview) return l;
    const { videoUrl, ...rest } = l || {};
    return rest;
  });
  return {
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
    lessonsList: filtered,
    published: row.published,
    requiresCode: !!row.requires_code,
    previewLessons: preview,
    coverUrl: row.cover_url ?? "",
    ownerId: row.owner_id,
    enrolled,
  };
};

// 列表：未登录只能看 published；登录后讲师/管理员可看自己的草稿
// 在学人次 = 实际加入该课程的人数（参考 course_enrollments 动态统计）
r.get("/", async (req, res) => {
  const me = req.user;
  const countSql = "(SELECT count(*) FROM course_enrollments ce WHERE ce.course_id = c.id) AS students";
  let sql = `SELECT c.*, ${countSql} FROM courses c WHERE c.published = true`;
  const params = [];
  if (me && (me.role === "admin" || me.role === "teacher")) {
    sql = `SELECT c.*, ${countSql} FROM courses c WHERE c.published = true OR c.owner_id = $1`;
    params.push(me.sub);
  }
  if (me?.role === "admin") sql = `SELECT c.*, ${countSql} FROM courses c`;
  const { rows } = await q(sql + " ORDER BY c.created_at DESC", params);
  res.json(rows.map(rowToCourse));
});

r.get("/:id", async (req, res) => {
  const { rows } = await q(
    `SELECT c.*,
      (SELECT count(*) FROM course_enrollments ce WHERE ce.course_id = c.id) AS students
     FROM courses c WHERE c.id=$1`,
    [req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: "课程不存在" });
  const me = req.user;
  let enrolled = false;
  let canEditAll = false;
  if (me) {
    if (me.role === "admin" || rows[0].owner_id === me.sub) canEditAll = true;
    if (!enrolled) {
      const e = await q(
        "SELECT 1 FROM course_enrollments WHERE user_id=$1 AND course_id=$2",
        [me.sub, req.params.id],
      );
      enrolled = !!e.rowCount;
    }
  }
  res.json(rowToCourse(rows[0], { enrolled, canEditAll }));
});

r.post("/", requireRole("teacher", "admin"), async (req, res) => {
  const p = CourseIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.message });
  const c = p.data;
  try {
    const { rows } = await q(
      `INSERT INTO courses(id,title,description,instructor,level,duration,lessons,category,emoji,lessons_list,published,owner_id,requires_code,preview_lessons,cover_url)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        c.id, c.title, c.description, c.instructor, c.level, c.duration,
        c.lessons, c.category, c.emoji,
        JSON.stringify(c.lessonsList), c.published, req.user.sub,
        c.requiresCode, c.previewLessons, c.coverUrl,
      ],
    );
    res.json(rowToCourse(rows[0], { canEditAll: true }));
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
    category: "category", emoji: "emoji",
    published: "published",
    requiresCode: "requires_code",
    previewLessons: "preview_lessons",
    coverUrl: "cover_url",
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
  res.json(rowToCourse(rows[0], { canEditAll: true }));
});

r.delete("/:id", requireRole("teacher", "admin"), async (req, res) => {
  const existing = await q("SELECT owner_id FROM courses WHERE id=$1", [req.params.id]);
  if (!existing.rowCount) return res.json({ ok: true });
  if (req.user.role !== "admin" && existing.rows[0].owner_id !== req.user.sub)
    return res.status(403).json({ error: "不能删除别人的课程" });
  await q("DELETE FROM courses WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

// 标记一节课为完成（用于段位积分）
r.post("/:id/lessons/:idx/complete", requireAuth, async (req, res) => {
  const idx = parseInt(req.params.idx, 10);
  if (!Number.isFinite(idx) || idx < 0)
    return res.status(400).json({ error: "lesson idx 非法" });
  await q(
    `INSERT INTO lesson_progress(user_id,course_id,lesson_idx)
     VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
    [req.user.sub, req.params.id, idx],
  );
  res.json({ ok: true });
});

// 我对某课程的进度
r.get("/:id/progress", requireAuth, async (req, res) => {
  const { rows } = await q(
    `SELECT lesson_idx FROM lesson_progress
      WHERE user_id=$1 AND course_id=$2 ORDER BY lesson_idx`,
    [req.user.sub, req.params.id],
  );
  res.json({ completed: rows.map((r) => r.lesson_idx) });
});

// 加入课程（可选兑换码）
r.post("/:id/join", requireAuth, async (req, res) => {
  const courseId = req.params.id;
  const code = (req.body?.code || "").trim().toUpperCase();
  const c = await q("SELECT requires_code FROM courses WHERE id=$1", [courseId]);
  if (!c.rowCount) return res.status(404).json({ error: "课程不存在" });

  if (c.rows[0].requires_code) {
    if (!code) return res.status(400).json({ error: "该课程需要兑换码" });
    const cc = await q(
      `SELECT uses_left, expires_at FROM course_codes
        WHERE code=$1 AND course_id=$2`,
      [code, courseId],
    );
    if (!cc.rowCount) return res.status(400).json({ error: "兑换码无效" });
    if (cc.rows[0].uses_left <= 0) return res.status(400).json({ error: "兑换码已用完" });
    if (cc.rows[0].expires_at && new Date(cc.rows[0].expires_at) < new Date())
      return res.status(400).json({ error: "兑换码已过期" });
    await q("UPDATE course_codes SET uses_left = uses_left - 1 WHERE code=$1", [code]);
  }

  await q(
    `INSERT INTO course_enrollments(user_id,course_id) VALUES($1,$2)
     ON CONFLICT DO NOTHING`,
    [req.user.sub, courseId],
  );
  res.json({ ok: true });
});

// 我是否已加入
r.get("/:id/enrollment", requireAuth, async (req, res) => {
  const e = await q(
    "SELECT joined_at FROM course_enrollments WHERE user_id=$1 AND course_id=$2",
    [req.user.sub, req.params.id],
  );
  res.json({ enrolled: !!e.rowCount, joinedAt: e.rows[0]?.joined_at ?? null });
});

export default r;