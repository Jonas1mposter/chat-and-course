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