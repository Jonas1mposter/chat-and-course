import { Router } from "express";
import { z } from "zod";
import { q } from "../db.js";
import { requireAuth } from "../auth.js";
import { TITLES, titleOf } from "../gamify.js";
import { streakOf } from "../social.js";

const r = Router();
const pair = (x, y) => (x < y ? [x, y] : [y, x]);

// ---- 打卡 ----
r.get("/checkin", requireAuth, async (req, res) => {
  res.json(await streakOf(req.user.sub));
});

r.post("/checkin", requireAuth, async (req, res) => {
  const ins = await q(
    `INSERT INTO daily_checkins(user_id) VALUES($1)
     ON CONFLICT DO NOTHING RETURNING day`,
    [req.user.sub],
  );
  const s = await streakOf(req.user.sub);
  res.json({ ...s, gained: ins.rowCount ? 2 : 0, already: !ins.rowCount });
});

// ---- 称号 ----
r.get("/titles", requireAuth, async (req, res) => {
  const u = await q("SELECT title FROM users WHERE id=$1", [req.user.sub]);
  res.json({ current: u.rows[0]?.title || "", all: TITLES });
});

r.post("/title", requireAuth, async (req, res) => {
  const key = String(req.body?.key || "");
  if (key && !titleOf(key)) return res.status(400).json({ error: "称号不存在" });
  await q("UPDATE users SET title=$2 WHERE id=$1", [req.user.sub, key]);
  res.json({ ok: true, title: key });
});

// ---- 好友 ----
r.get("/friends", requireAuth, async (req, res) => {
  const uid = req.user.sub;
  const { rows } = await q(
    `SELECT u.id, u.name, u.role, u.title, user_points(u.id) AS points
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.a=$1 THEN f.b ELSE f.a END
      WHERE f.status='accepted' AND ($1 IN (f.a, f.b))
      ORDER BY points DESC`,
    [uid],
  );
  res.json(rows.map((x) => ({ ...x, points: Number(x.points) })));
});

r.get("/requests", requireAuth, async (req, res) => {
  const uid = req.user.sub;
  const incoming = await q(
    `SELECT u.id, u.name, u.role, u.title, f.created_at
       FROM friendships f
       JOIN users u ON u.id = f.requester
      WHERE f.status='pending' AND f.requester <> $1 AND ($1 IN (f.a, f.b))
      ORDER BY f.created_at DESC`,
    [uid],
  );
  const outgoing = await q(
    `SELECT u.id, u.name, u.role, u.title, f.created_at
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.a=$1 THEN f.b ELSE f.a END
      WHERE f.status='pending' AND f.requester = $1 AND ($1 IN (f.a, f.b))
      ORDER BY f.created_at DESC`,
    [uid],
  );
  res.json({ incoming: incoming.rows, outgoing: outgoing.rows });
});

r.get("/search", requireAuth, async (req, res) => {
  const term = String(req.query.q || "").trim();
  if (term.length < 1) return res.json([]);
  const { rows } = await q(
    `SELECT u.id, u.name, u.role, u.title, user_points(u.id) AS points,
            COALESCE(f.status, '') AS status,
            COALESCE(f.requester::text, '') AS requester
       FROM users u
       LEFT JOIN friendships f
         ON (f.a = LEAST(u.id,$2::uuid) AND f.b = GREATEST(u.id,$2::uuid))
      WHERE u.id <> $2 AND u.name ILIKE $1
      ORDER BY points DESC
      LIMIT 20`,
    [`%${term}%`, req.user.sub],
  );
  res.json(rows.map((x) => ({ ...x, points: Number(x.points) })));
});

const IdIn = z.object({ userId: z.string().uuid() });

r.post("/request", requireAuth, async (req, res) => {
  const { userId } = IdIn.parse(req.body);
  if (userId === req.user.sub) return res.status(400).json({ error: "不能加自己为好友" });
  const target = await q("SELECT id FROM users WHERE id=$1", [userId]);
  if (!target.rowCount) return res.status(404).json({ error: "用户不存在" });
  const [a, b] = pair(req.user.sub, userId);
  const exist = await q("SELECT status, requester FROM friendships WHERE a=$1 AND b=$2", [a, b]);
  if (exist.rowCount) {
    const row = exist.rows[0];
    if (row.status === "accepted") return res.json({ status: "accepted" });
    // 对方已申请 → 直接成为好友
    if (row.requester === userId) {
      await q(
        "UPDATE friendships SET status='accepted', accepted_at=now() WHERE a=$1 AND b=$2",
        [a, b],
      );
      return res.json({ status: "accepted" });
    }
    return res.json({ status: "pending" });
  }
  await q("INSERT INTO friendships(a,b,status,requester) VALUES($1,$2,'pending',$3)", [
    a,
    b,
    req.user.sub,
  ]);
  res.json({ status: "pending" });
});

r.post("/accept", requireAuth, async (req, res) => {
  const { userId } = IdIn.parse(req.body);
  const [a, b] = pair(req.user.sub, userId);
  const upd = await q(
    `UPDATE friendships SET status='accepted', accepted_at=now()
      WHERE a=$1 AND b=$2 AND status='pending' AND requester=$3`,
    [a, b, userId],
  );
  if (!upd.rowCount) return res.status(404).json({ error: "没有待处理的好友申请" });
  res.json({ status: "accepted" });
});

r.delete("/:userId", requireAuth, async (req, res) => {
  const [a, b] = pair(req.user.sub, req.params.userId);
  await q("DELETE FROM friendships WHERE a=$1 AND b=$2", [a, b]);
  res.json({ ok: true });
});

export default r;
