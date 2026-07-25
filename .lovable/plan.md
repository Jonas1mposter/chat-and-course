# 从 Community Hub 搬运到当前架构（Express + 自建 Postgres）

## 前提

Community Hub 用 Supabase，你这边用自己服务器的 Express + Postgres。搬运的核心是**只搬 UI + 功能语义**，数据层全部改走 `src/lib/api.ts` → Express `/api/*`。

我把工作拆成 **4 批**，每批可以独立跑，且不会打断已有功能（注册/登录/发帖/上传视频）。

---

## 批次 1 — 后端与数据库补齐（必须先做）

**新增/修改的 SQL（`server/src/schema.sql`）**
- `courses` 表新增：`requires_code boolean`、`preview_lessons int`（试看课时数）、`cover_url text`
- 新表 `course_enrollments(user_id, course_id, joined_at)`
- 新表 `course_codes(code text pk, course_id, uses_left int, expires_at)`
- `videos` 表新增：`cover_key text`（用于封面单独直传 COS）

**新增/修改的 Express 路由**
- `POST /api/auth/claim-admin` — 全站尚无管理员时，把当前登录用户升为 admin（首装向导）
- `POST /api/courses/:id/join` — body 可选 `{ code }`；无需 code 或 code 有效则写入 enrollments
- `GET /api/courses/:id/enrollment` — 我是否已加入
- `POST /api/admin/course-codes` — 讲师/admin 生成兑换码
- 课程 GET 返回追加 `requiresCode` / `previewLessons` / `coverUrl` / `enrolled`（对当前用户）
- 视频封面：`POST /api/videos/sign-upload-cover` 复用 COS 预签名

**迁移执行**
你 SSH 上 `/root/chat-and-course/server` 跑一次 `npm run migrate`。SQL 都是 `CREATE ... IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`，不会破坏现有数据。

---

## 批次 2 — 前端：admin + 课程报名与试看

- 新页 `/admin/setup` — 一次性把自己升为管理员
- `/courses/$courseId` 增强：
  - 未登录/未加入 → 只显示前 N 节（`previewLessons`）视频，其余打上 🔒
  - "立即加入"按钮：若 `requiresCode` 弹兑换码输入，否则一键加入
  - 加入成功后刷新页面即可看全部课时
- `/courses/new` 与 `/courses/:id/edit` 表单：新增"是否需要兑换码"、"试看课时数"、"封面 URL"字段
- 讲师/admin 在课程编辑页有"生成 5 个兑换码"按钮，弹出列表复制

---

## 批次 3 — 前端：首页改用真实 API + 视频封面上传

- `src/routes/index.tsx` 去掉 `mock-data`，改用 `useQuery` 读 `/api/courses` 和 `/api/posts`（各取 3 条）；空态友好
- `/videos/new` 新增"上传封面"输入，走 `sign-upload-cover` 直传 COS，替换现在的手填 coverUrl（保留 URL 兜底）
- 视频详情 / 视频墙不改数据形状，只是 `coverUrl` 现在能真的存在

---

## 批次 4（可选，成本较高）— PDF 附件

Community Hub 的 PDF 预览用了 `pdfjs-dist` + 一个 `api.document-proxy.ts` 服务端代理。因为你的架构里 Express 就是后端，直接在 Express 上做 `/api/document-proxy?url=...` 即可，前端 pdfjs 已装好。
如果不常用附件，我建议**先不做**，等你确认要再加。

---

## 我不搬的东西
- Supabase Auth / Storage / Edge Functions / RPC 全部替换成 Express + JWT + COS
- `src/integrations/supabase/*` 不迁移
- 那边表 schema 里的 RLS/policies 不搬（你的架构靠 Express 中间件鉴权）

---

## 技术细节（给日后自查用）

- 兑换码用 `crypto.randomBytes(4).toString("hex")` 生成 8 位，unique 索引
- `enrollments` 用 `(user_id, course_id)` 联合主键；未加入的课时视频 URL 在 API 层直接不返回（防绕过前端）
- `has_admin()` SQL 函数用于 `claim-admin` 的原子性判断，防并发抢占
- 前端表单新增字段沿用现有 `CourseForm`，通过 `initial` 兼容旧数据

---

**告诉我从哪一批开始**（默认按 1→2→3 顺序）。如果你想让我一次性把 1+2+3 都写完再统一让你重启后端，我也可以。