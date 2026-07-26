import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { q } from "../db.js";
import { requireAuth } from "../auth.js";
import { presignPutUrl, publicUrlFor as cosPublicUrlFor, isConfigured as cosIsConfigured } from "../cos.js";
import { publicUrlFor as localPublicUrlFor, uploaderFor } from "../uploads.js";

const r = Router();

const SignIn = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(100),
});

// 兼容：如果 COS 已配置，保留原来的预签名直传；否则用本地存储
function resolvePublicUrl(key, req) {
  if (cosIsConfigured()) return cosPublicUrlFor(key);
  return localPublicUrlFor(key, req);
}

// 1a) 获取 COS 上传预签名（仅 COS 配置时有效）
r.post("/sign-upload", requireAuth, async (req, res) => {
  if (!cosIsConfigured()) return res.status(400).json({ error: "当前未启用 COS，请使用 /upload" });
  const p = SignIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.message });
  const safe = p.data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `videos/${req.user.sub}/${Date.now()}-${randomUUID().slice(0, 8)}-${safe}`;
  try {
    const url = await presignPutUrl(key, 600);
    res.json({ uploadUrl: url, key, publicUrl: cosPublicUrlFor(key) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 1b) 本地服务器接收视频文件（无 COS 时的默认方案）
r.post("/upload", requireAuth, uploaderFor("videos").single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "没有收到文件" });
  const key = `videos/${req.file.filename}`;
  res.json({ key, publicUrl: localPublicUrlFor(key, req), sizeBytes: req.file.size });
});

// 2a) 获取 COS 封面上传预签名
r.post("/sign-upload-cover", requireAuth, async (req, res) => {
  if (!cosIsConfigured()) return res.status(400).json({ error: "当前未启用 COS，请使用 /upload-cover" });
  const p = SignIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.message });
  const safe = p.data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `covers/${req.user.sub}/${Date.now()}-${randomUUID().slice(0, 8)}-${safe}`;
  try {
    const url = await presignPutUrl(key, 600);
    res.json({ uploadUrl: url, key, publicUrl: cosPublicUrlFor(key) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2b) 本地服务器接收封面文件
r.post("/upload-cover", requireAuth, uploaderFor("covers").single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "没有收到文件" });
  const key = `covers/${req.file.filename}`;
  res.json({ key, publicUrl: localPublicUrlFor(key, req) });
});

const CreateIn = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(""),
  cosKey: z.string().min(1),
  coverUrl: z.string().optional().or(z.literal("")).default(""),
  duration: z.number().int().nonnegative().optional().default(0),
  sizeBytes: z.number().int().nonnegative().optional().default(0),
});

// 3) 创建视频记录
r.post("/", requireAuth, async (req, res) => {
  const p = CreateIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.message });
  const { title, description, cosKey, coverUrl, duration, sizeBytes } = p.data;
  const url = resolvePublicUrl(cosKey, req);
  const { rows } = await q(
    `INSERT INTO videos(owner_id,title,description,cos_key,url,cover_url,duration,size_bytes)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [req.user.sub, title, description, cosKey, url, coverUrl, duration, sizeBytes],
  );
  res.json({ id: rows[0].id });
});

// 4) 视频列表
r.get("/", async (req, res) => {
  const ownerId = req.query.ownerId;
  const params = [];
  let where = "";
  if (ownerId) {
    params.push(ownerId);
    where = `WHERE v.owner_id = $${params.length}`;
  }
  const { rows } = await q(
    `SELECT v.*, u.name AS author_name,
       (SELECT count(*) FROM video_likes vl WHERE vl.video_id=v.id) AS likes
     FROM videos v JOIN users u ON u.id=v.owner_id
     ${where}
     ORDER BY v.created_at DESC LIMIT 100`,
    params,
  );
  res.json(rows.map(rowToVideo));
});

// 5) 视频详情（顺便 +1 播放数）
r.get("/:id", async (req, res) => {
  const me = req.user?.sub || null;
  const { rows } = await q(
    `SELECT v.*, u.name AS author_name,
       (SELECT count(*) FROM video_likes vl WHERE vl.video_id=v.id) AS likes,
       ${me ? `EXISTS(SELECT 1 FROM video_likes vl WHERE vl.video_id=v.id AND vl.user_id=$2)` : `false`} AS liked
     FROM videos v JOIN users u ON u.id=v.owner_id WHERE v.id=$1`,
    me ? [req.params.id, me] : [req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: "视频不存在" });
  q("UPDATE videos SET plays=plays+1 WHERE id=$1", [req.params.id]).catch(() => {});
  res.json(rowToVideo(rows[0]));
});

// 6) 点赞 / 取消点赞
r.post("/:id/like", requireAuth, async (req, res) => {
  const ex = await q(
    "SELECT 1 FROM video_likes WHERE video_id=$1 AND user_id=$2",
    [req.params.id, req.user.sub],
  );
  if (ex.rowCount) {
    await q("DELETE FROM video_likes WHERE video_id=$1 AND user_id=$2", [
      req.params.id, req.user.sub,
    ]);
    res.json({ liked: false });
  } else {
    await q(
      "INSERT INTO video_likes(video_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
      [req.params.id, req.user.sub],
    );
    res.json({ liked: true });
  }
});

// 7) 删除
r.delete("/:id", requireAuth, async (req, res) => {
  const own = await q("SELECT owner_id FROM videos WHERE id=$1", [req.params.id]);
  if (!own.rowCount) return res.json({ ok: true });
  if (req.user.role !== "admin" && own.rows[0].owner_id !== req.user.sub)
    return res.status(403).json({ error: "无权限" });
  await q("DELETE FROM videos WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

function rowToVideo(v) {
  return {
    id: v.id,
    ownerId: v.owner_id,
    author: v.author_name,
    title: v.title,
    description: v.description,
    url: v.url,
    coverUrl: v.cover_url,
    duration: v.duration,
    sizeBytes: Number(v.size_bytes ?? 0),
    plays: v.plays,
    likes: Number(v.likes ?? 0),
    liked: v.liked ?? false,
    createdAt: new Date(v.created_at).toLocaleString("zh-CN"),
  };
}

export default r;
