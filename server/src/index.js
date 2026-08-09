import express from "express";
import cors from "cors";
import "dotenv/config";
import { resolve } from "path";
import { fileURLToPath } from "url";

import { authOptional } from "./auth.js";
import auth from "./routes/auth.js";
import courses from "./routes/courses.js";
import posts from "./routes/posts.js";
import videos from "./routes/videos.js";
import users from "./routes/users.js";
import admin from "./routes/admin.js";
import moderation from "./routes/moderation.js";
import lessonComments from "./routes/lesson-comments.js";
import { ensureUploadsDir, UPLOADS_DIR } from "./uploads.js";
import { rateLimit } from "./ratelimit.js";

const app = express();
app.set("trust proxy", true);
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "*").split(",").map((s) => s.trim()),
    credentials: false,
  }),
);
app.use(authOptional);

ensureUploadsDir();

// ---- 静态资源防护 & 流量优化 ----
const ALLOWED_HOSTS = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter((s) => s && s !== "*")
  .map((s) => {
    try {
      return new URL(s).hostname;
    } catch {
      return s;
    }
  });

// 防盗链：带 Referer 时必须来自白名单域（直链粘贴/爬虫命中率最高的场景）
function hotlinkGuard(req, res, next) {
  const ref = req.get("referer");
  if (ref && ALLOWED_HOSTS.length) {
    let host = "";
    try {
      host = new URL(ref).hostname;
    } catch {
      host = "";
    }
    const ok = ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
    if (!ok) return res.status(403).end();
  }
  next();
}

const mediaLimiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.MEDIA_RATE_PER_MIN || 240),
  message: "访问过于频繁",
});

app.use(
  "/uploads",
  hotlinkGuard,
  mediaLimiter,
  express.static(UPLOADS_DIR, {
    // 文件名带时间戳+UUID，内容不可变 → 长缓存，显著减少重复回源流量
    maxAge: "30d",
    immutable: true,
    etag: true,
    lastModified: true,
    dotfiles: "deny",
    index: false,
    setHeaders: (res, filePath) => {
      // 强制在线预览，禁止浏览器“另存为”式下载
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
      res.setHeader("Accept-Ranges", "bytes");
      if (/\.(mp4|mov|m4v|webm)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "private, max-age=2592000, immutable");
      }
    },
  }),
);

// 全局 API 限流（按用户/IP）
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    max: Number(process.env.API_RATE_PER_MIN || 300),
  }),
);

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use("/api/auth", auth);
app.use("/api/courses", courses);
app.use("/api/courses/:id/lessons/:idx/comments", lessonComments);
app.use("/api/posts", posts);
app.use("/api/videos", videos);
app.use("/api/users", users);
app.use("/api/admin", admin);
app.use("/api/moderation", moderation);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "服务器错误" });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on :${port}`));