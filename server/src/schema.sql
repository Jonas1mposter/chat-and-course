-- 超脑 Studio 数据库结构
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 角色枚举
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('student', 'teacher', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS users (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name         text NOT NULL,
  role         app_role NOT NULL DEFAULT 'student',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  id           text PRIMARY KEY,
  title        text NOT NULL,
  description  text NOT NULL DEFAULT '',
  instructor   text NOT NULL DEFAULT '',
  level        text NOT NULL DEFAULT '入门',
  duration     text NOT NULL DEFAULT '',
  lessons      int  NOT NULL DEFAULT 0,
  students     int  NOT NULL DEFAULT 0,
  category     text NOT NULL DEFAULT '',
  emoji        text NOT NULL DEFAULT '',
  lessons_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  published    boolean NOT NULL DEFAULT false,
  owner_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS requires_code   boolean NOT NULL DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS preview_lessons int     NOT NULL DEFAULT 1;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_url       text    NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS course_enrollments (
  user_id   uuid REFERENCES users(id)   ON DELETE CASCADE,
  course_id text REFERENCES courses(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS course_codes (
  code       text PRIMARY KEY,
  course_id  text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  uses_left  int  NOT NULL DEFAULT 1,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS course_codes_course_idx ON course_codes(course_id);

CREATE TABLE IF NOT EXISTS posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    text REFERENCES courses(id) ON DELETE SET NULL,
  category     text NOT NULL DEFAULT '公告',
  title        text NOT NULL,
  content      text NOT NULL,
  author_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pinned       boolean NOT NULL DEFAULT false,
  likes        int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS posts_course_idx ON posts(course_id);

CREATE TABLE IF NOT EXISTS replies (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      text NOT NULL,
  likes        int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS replies_post_idx ON replies(post_id);

-- ============ 点赞去重 ============
CREATE TABLE IF NOT EXISTS post_likes (
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(post_id, user_id)
);

-- ============ 视频 ============
CREATE TABLE IF NOT EXISTS videos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text NOT NULL DEFAULT '',
  cos_key      text NOT NULL,
  url          text NOT NULL,
  cover_url    text NOT NULL DEFAULT '',
  duration     int  NOT NULL DEFAULT 0,
  size_bytes   bigint NOT NULL DEFAULT 0,
  plays        int  NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS cover_key text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS videos_owner_idx ON videos(owner_id);

CREATE TABLE IF NOT EXISTS video_likes (
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  user_id  uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(video_id, user_id)
);

-- ============ 课程进度 ============
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id  text REFERENCES courses(id) ON DELETE CASCADE,
  lesson_idx int NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, course_id, lesson_idx)
);

-- ============ 课时评论 / 讲师出题 ============
CREATE TABLE IF NOT EXISTS lesson_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_idx  int  NOT NULL,
  author_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        text NOT NULL DEFAULT 'comment', -- 'comment' | 'question'
  content     text NOT NULL,
  parent_id   uuid REFERENCES lesson_comments(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lesson_comments_lesson_idx
  ON lesson_comments(course_id, lesson_idx, created_at);

-- ============ 积分函数 ============
-- 发帖+5  评论+2  收到帖子赞+1  上传视频+10  收到视频赞+2  完成一节课+3
CREATE OR REPLACE FUNCTION user_points(uid uuid) RETURNS int
LANGUAGE sql STABLE AS $$
  SELECT COALESCE((
    SELECT 5  * COUNT(*) FROM posts   WHERE author_id = uid
  ),0) + COALESCE((
    SELECT 2  * COUNT(*) FROM replies WHERE author_id = uid
  ),0) + COALESCE((
    SELECT 1  * COUNT(*) FROM post_likes  pl JOIN posts  p ON p.id=pl.post_id  WHERE p.author_id = uid
  ),0) + COALESCE((
    SELECT 10 * COUNT(*) FROM videos WHERE owner_id  = uid
  ),0) + COALESCE((
    SELECT 2  * COUNT(*) FROM video_likes vl JOIN videos v ON v.id=vl.video_id WHERE v.owner_id  = uid
  ),0) + COALESCE((
    SELECT 3  * COUNT(*) FROM lesson_progress WHERE user_id = uid
  ),0);
$$;
-- ============ 密码重置 ============
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  code_hash  text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  attempts   int NOT NULL DEFAULT 0,
  ip         text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prc_email_idx ON password_reset_codes(email, created_at DESC);

CREATE TABLE IF NOT EXISTS password_reset_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  email      text NOT NULL,
  method     text NOT NULL,            -- 'request' | 'self_code' | 'admin'
  actor_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_email text,
  success    boolean NOT NULL DEFAULT true,
  detail     text,
  ip         text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prl_created_idx ON password_reset_logs(created_at DESC);

-- ============ 内容审核：举报 / 屏蔽（App Store 1.2 UGC 要求）============
CREATE TABLE IF NOT EXISTS content_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES users(id) ON DELETE SET NULL,
  target_type text NOT NULL,   -- 'post' | 'reply' | 'lesson_comment' | 'video' | 'user'
  target_id   text NOT NULL,
  reason      text NOT NULL,
  detail      text,
  status      text NOT NULL DEFAULT 'open',   -- 'open' | 'resolved'
  resolution  text,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS content_reports_status_idx
  ON content_reports(status, created_at DESC);

CREATE TABLE IF NOT EXISTS user_blocks (
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  blocked_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, blocked_id)
);

-- 账号注销记录（保留最小化审计信息，不含个人内容）
CREATE TABLE IF NOT EXISTS account_deletions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash text NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

-- ============ 滥用防护：自动封禁 + 审计日志 ============
CREATE TABLE IF NOT EXISTS abuse_bans (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope      text NOT NULL,              -- 'ip' | 'ua'
  value      text NOT NULL,              -- IP 或 UA 指纹
  reason     text NOT NULL,
  hits       integer NOT NULL DEFAULT 0,
  strikes    integer NOT NULL DEFAULT 1, -- 第几次被封（用于时长升级）
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  released_by uuid REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(scope, value, created_at)
);
CREATE INDEX IF NOT EXISTS abuse_bans_active_idx ON abuse_bans(scope, value, expires_at DESC);

CREATE TABLE IF NOT EXISTS abuse_audit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event      text NOT NULL,              -- 'ban' | 'blocked' | 'release' | 'threshold'
  scope      text,
  value      text,
  reason     text,
  ip         text,
  user_agent text,
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  path       text,
  detail     jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS abuse_audit_created_idx ON abuse_audit_logs(created_at DESC);
