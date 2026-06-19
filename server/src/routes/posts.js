import { Router } from "express";
import { z } from "zod";
import { q } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const r = Router();

const PostIn = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category: z.string().default("讨论"),
  courseId: z.string().optional().nullable(),
});

const ReplyIn = z.object({ content: z.string().min(1) });

// 帖子列表（按课程 / 分类筛选）
r.get("/", async (req, res) => {
  const { courseId, category } = req.query;
  const where = [];
  const params = [];
  if (courseId) { params.push(courseId); where.push(`p.course_id=$${params.length}`); }
  if (category && category !== "全部") { params.push(category); where.push(`p.category=$${params.length}`); }
  const sql = `
    SELECT p.*, u.name AS author_name, u.role AS author_role,
      (SELECT count(*) FROM replies r WHERE r.post_id=p.id) AS replies_count
    FROM posts p JOIN users u ON u.id=p.author_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY p.pinned DESC, p.created_at DESC
    LIMIT 100`;
  const { rows } = await q(sql, params);
  res.json(rows.map(rowToPost));
});

r.get("/:id", async (req, res) => {
  const { rows } = await q(
    `SELECT p.*, u.name AS author_name, u.role AS author_role,
      (SELECT count(*) FROM replies r WHERE r.post_id=p.id) AS replies_count
     FROM posts p JOIN users u ON u.id=p.author_id WHERE p.id=$1`,
    [req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: "帖子不存在" });
  const replies = await q(
    `SELECT r.*, u.name AS author_name FROM replies r
     JOIN users u ON u.id=r.author_id WHERE r.post_id=$1 ORDER BY r.created_at ASC`,
    [req.params.id],
  );
  res.json({
    post: rowToPost(rows[0]),
    replies: replies.rows.map((r) => ({
      id: r.id,
      postId: r.post_id,
      author: r.author_name,
      authorAvatar: r.author_name?.[0] ?? "?",
      content: r.content,
      likes: r.likes,
      createdAt: new Date(r.created_at).toLocaleString("zh-CN"),
    })),
  });
});

r.post("/", requireAuth, async (req, res) => {
  const p = PostIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.message });
  const { title, content, category, courseId } = p.data;
  const { rows } = await q(
    `INSERT INTO posts(title,content,category,course_id,author_id)
     VALUES($1,$2,$3,$4,$5) RETURNING id`,
    [title, content, category, courseId || null, req.user.sub],
  );
  res.json({ id: rows[0].id });
});

r.post("/:id/replies", requireAuth, async (req, res) => {
  const p = ReplyIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.message });
  const { rows } = await q(
    `INSERT INTO replies(post_id,author_id,content) VALUES($1,$2,$3) RETURNING id`,
    [req.params.id, req.user.sub, p.data.content],
  );
  res.json({ id: rows[0].id });
});

// 点赞 / 取消点赞
r.post("/:id/like", requireAuth, async (req, res) => {
  const ex = await q(
    "SELECT 1 FROM post_likes WHERE post_id=$1 AND user_id=$2",
    [req.params.id, req.user.sub],
  );
  if (ex.rowCount) {
    await q("DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2", [
      req.params.id, req.user.sub,
    ]);
    await q("UPDATE posts SET likes = GREATEST(likes-1,0) WHERE id=$1", [req.params.id]);
    res.json({ liked: false });
  } else {
    await q(
      "INSERT INTO post_likes(post_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
      [req.params.id, req.user.sub],
    );
    await q("UPDATE posts SET likes = likes+1 WHERE id=$1", [req.params.id]);
    res.json({ liked: true });
  }
});

// 完成一节课（积分用）
r.post("/lesson-progress", requireAuth, async (req, res) => {
  // 这里复用 posts 路由文件是为了少建文件；逻辑放对应位置即可
  res.status(404).end();
});

r.post("/:id/pin", requireRole("admin"), async (req, res) => {
  await q("UPDATE posts SET pinned = NOT pinned WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

r.delete("/:id", requireAuth, async (req, res) => {
  const own = await q("SELECT author_id FROM posts WHERE id=$1", [req.params.id]);
  if (!own.rowCount) return res.json({ ok: true });
  if (req.user.role !== "admin" && own.rows[0].author_id !== req.user.sub)
    return res.status(403).json({ error: "无权限" });
  await q("DELETE FROM posts WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

function rowToPost(p) {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    excerpt: p.content.slice(0, 80),
    category: p.category,
    courseId: p.course_id,
    author: p.author_name,
    authorAvatar: p.author_name?.[0] ?? "?",
    authorRole: p.author_role,
    pinned: p.pinned,
    likes: p.likes,
    replies: Number(p.replies_count ?? 0),
    createdAt: new Date(p.created_at).toLocaleString("zh-CN"),
  };
}

export default r;