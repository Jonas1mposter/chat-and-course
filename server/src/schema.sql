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
  emoji        text NOT NULL DEFAULT '📘',
  lessons_list jsonb NOT NULL DEFAULT '[]'::jsonb,
  published    boolean NOT NULL DEFAULT false,
  owner_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

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