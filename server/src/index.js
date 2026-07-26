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
import { ensureUploadsDir, UPLOADS_DIR } from "./uploads.js";

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
app.use("/uploads", express.static(UPLOADS_DIR, { maxAge: "1d" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.use("/api/auth", auth);
app.use("/api/courses", courses);
app.use("/api/posts", posts);
app.use("/api/videos", videos);
app.use("/api/users", users);
app.use("/api/admin", admin);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "服务器错误" });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API listening on :${port}`));