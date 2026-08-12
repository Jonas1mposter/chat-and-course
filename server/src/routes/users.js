import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { q } from "../db.js";
import { tierOf } from "../tier.js";
import { requireAuth } from "../auth.js";
import { evaluate } from "../gamify.js";
import { streakOf, friendCount } from "../social.js";

const r = Router();

// 排行榜
r.get("/leaderboard", async (_req, res) => {
  const { rows } = await q(
    `SELECT id, name, role, title, user_points(id) AS points
       FROM users
      ORDER BY points DESC, created_at ASC
      LIMIT 50`,
  );
  res.json(
    rows.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      title: u.title || "",
      ...tierOf(u.points),
    })),
  );
});

// 我自己的统计（含明细）
r.get("/me/stats", requireAuth, async (req, res) => {
  res.json(await statsFor(req.user.sub));
});

// 注销账号（App Store 5.1.1(v) 必须提供 App 内删除账号入口）
r.delete("/me", requireAuth, async (req, res) => {
  const password = String(req.body?.password || "");
  const u = await q("SELECT id,email,password_hash FROM users WHERE id=$1", [
    req.user.sub,
  ]);
  if (!u.rowCount) return res.status(404).json({ error: "用户不存在" });
  const ok = password && (await bcrypt.compare(password, u.rows[0].password_hash));
  if (!ok) return res.status(403).json({ error: "密码不正确，无法注销账号" });

  const emailHash = crypto
    .createHash("sha256")
    .update(String(u.rows[0].email).toLowerCase())
    .digest("hex");
  await q("INSERT INTO account_deletions(email_hash) VALUES($1)", [emailHash]);
  // 级联删除：帖子、回复、评论、进度、点赞、报名等均带 ON DELETE CASCADE
  await q("DELETE FROM users WHERE id=$1", [req.user.sub]);
  res.json({ ok: true });
});

// 任意用户的公开统计
r.get("/:id", async (req, res) => {
  const u = await q("SELECT id,name,role,title,created_at FROM users WHERE id=$1", [
    req.params.id,
  ]);
  if (!u.rowCount) return res.status(404).json({ error: "用户不存在" });
  const s = await statsFor(req.params.id);
  res.json({
    id: u.rows[0].id,
    name: u.rows[0].name,
    role: u.rows[0].role,
    title: u.rows[0].title || "",
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
        (SELECT count(*) FROM course_enrollments WHERE user_id=$1) AS enrollments,
        (SELECT count(*) FROM lesson_comments WHERE author_id=$1 AND kind <> 'question') AS lesson_comments,
        (SELECT count(*) FROM lesson_comments WHERE author_id=$1 AND kind = 'question') AS questions,
        (SELECT COALESCE(SUM(GREATEST(likes,0)),0) FROM replies WHERE author_id=$1) AS reply_likes,
        (SELECT count(*) FROM post_likes  pl JOIN posts  p ON p.id=pl.post_id  WHERE p.author_id=$1) AS post_likes,
        (SELECT count(*) FROM video_likes vl JOIN videos v ON v.id=vl.video_id WHERE v.owner_id=$1)  AS video_likes`,
    [uid],
  );
  const streak = await streakOf(uid);
  const friends = await friendCount(uid);
  const b = {
      posts: Number(counts.rows[0].posts),
      replies: Number(counts.rows[0].replies),
      videos: Number(counts.rows[0].videos),
      lessons: Number(counts.rows[0].lessons),
      enrollments: Number(counts.rows[0].enrollments),
      lessonComments: Number(counts.rows[0].lesson_comments),
      questions: Number(counts.rows[0].questions),
      replyLikes: Number(counts.rows[0].reply_likes),
      postLikes: Number(counts.rows[0].post_likes),
      videoLikes: Number(counts.rows[0].video_likes),
  };
  const achievements = evaluate({
    ...b,
    likes: b.replyLikes + b.postLikes + b.videoLikes,
    streak: streak.streak,
    friends,
    points: pts,
  });
  return {
    ...tierOf(pts),
    streak: streak.streak,
    checkedToday: streak.checkedToday,
    checkinTotal: streak.total,
    friends,
    achievements,
    breakdown: {
      posts: Number(counts.rows[0].posts),
      replies: Number(counts.rows[0].replies),
      videos: Number(counts.rows[0].videos),
      lessons: Number(counts.rows[0].lessons),
      enrollments: Number(counts.rows[0].enrollments),
      lessonComments: Number(counts.rows[0].lesson_comments),
      questions: Number(counts.rows[0].questions),
      replyLikes: Number(counts.rows[0].reply_likes),
      postLikes: Number(counts.rows[0].post_likes),
      videoLikes: Number(counts.rows[0].video_likes),
    },
  };
}

export default r;