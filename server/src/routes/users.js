import { Router } from "express";
import { q } from "../db.js";
import { tierOf } from "../tier.js";
import { requireAuth } from "../auth.js";

const r = Router();

// 排行榜
r.get("/leaderboard", async (_req, res) => {
  const { rows } = await q(
    `SELECT id, name, role, user_points(id) AS points
       FROM users
      ORDER BY points DESC, created_at ASC
      LIMIT 50`,
  );
  res.json(
    rows.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      ...tierOf(u.points),
    })),
  );
});

// 我自己的统计（含明细）
r.get("/me/stats", requireAuth, async (req, res) => {
  res.json(await statsFor(req.user.sub));
});

// 任意用户的公开统计
r.get("/:id", async (req, res) => {
  const u = await q("SELECT id,name,role,created_at FROM users WHERE id=$1", [
    req.params.id,
  ]);
  if (!u.rowCount) return res.status(404).json({ error: "用户不存在" });
  const s = await statsFor(req.params.id);
  res.json({
    id: u.rows[0].id,
    name: u.rows[0].name,
    role: u.rows[0].role,
    joinedAt: new Date(u.rows[0].created_at).toLocaleDateString("zh-CN"),
    ...s,
  });
});

async function statsFor(uid) {
  const r1 = await q("SELECT user_points($1) AS pts", [uid]);
  const pts = Number(r1.rows[0].pts || 0);
  const counts = await q(
    `SELECT
        (SELECT count(*) FROM posts   WHERE author_id=$1) AS posts,
        (SELECT count(*) FROM replies WHERE author_id=$1) AS replies,
        (SELECT count(*) FROM videos  WHERE owner_id=$1)  AS videos,
        (SELECT count(*) FROM lesson_progress WHERE user_id=$1) AS lessons,
        (SELECT count(*) FROM post_likes  pl JOIN posts  p ON p.id=pl.post_id  WHERE p.author_id=$1) AS post_likes,
        (SELECT count(*) FROM video_likes vl JOIN videos v ON v.id=vl.video_id WHERE v.owner_id=$1)  AS video_likes`,
    [uid],
  );
  return {
    ...tierOf(pts),
    breakdown: {
      posts: Number(counts.rows[0].posts),
      replies: Number(counts.rows[0].replies),
      videos: Number(counts.rows[0].videos),
      lessons: Number(counts.rows[0].lessons),
      postLikes: Number(counts.rows[0].post_likes),
      videoLikes: Number(counts.rows[0].video_likes),
    },
  };
}

export default r;