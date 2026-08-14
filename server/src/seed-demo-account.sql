-- ============================================================
-- Apple 审核演示账号 + 演示数据（可重复执行）
-- 账号: demo@superbrain-studio.cn  密码: Apple2026Demo!
-- 执行: psql "$DATABASE_URL" -f server/src/seed-demo-account.sql
-- ============================================================

-- 1) 创建/更新演示账号
INSERT INTO users(email, password_hash, name, role, title)
VALUES (
  'demo@superbrain-studio.cn',
  '$2b$10$v8Yd6KRHgnM85xjal0CsWuh/t6dpz84q6usRZ3Msi7mfV3V0isrt.',
  'Apple 审核演示账号',
  'student',
  ''
)
ON CONFLICT (email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      name          = EXCLUDED.name,
      role          = 'student';

-- 2) 加入全部已发布课程（绕过兑换码，审核员可直接看全部内容）
INSERT INTO course_enrollments(user_id, course_id)
SELECT u.id, c.id
FROM users u CROSS JOIN courses c
WHERE u.email = 'demo@superbrain-studio.cn' AND c.published = true
ON CONFLICT DO NOTHING;

-- 3) 学习进度：每门课完成前 3 节
INSERT INTO lesson_progress(user_id, course_id, lesson_idx)
SELECT u.id, c.id, g.i
FROM users u
CROSS JOIN courses c
CROSS JOIN LATERAL generate_series(0, 2) AS g(i)
WHERE u.email = 'demo@superbrain-studio.cn'
  AND c.published = true
  AND g.i < GREATEST(jsonb_array_length(c.lessons_list), 0)
ON CONFLICT DO NOTHING;

-- 4) 讨论区示例帖子
INSERT INTO posts(course_id, category, title, content, author_id)
SELECT
  (SELECT id FROM courses WHERE published = true ORDER BY created_at LIMIT 1),
  '学习心得',
  '第一次系统学习 AI 工具，记录一下我的收获',
  E'这几天跟着课程把提示词的基本结构过了一遍，最大的感受是"把任务说清楚"比"用什么模型"更重要。\n\n分享三个我常用的小技巧：\n1. 先描述角色和目标，再给约束条件；\n2. 复杂任务拆成几步，让模型逐步输出；\n3. 给一个示例输出，效果提升非常明显。\n\n欢迎大家一起交流～',
  u.id
FROM users u
WHERE u.email = 'demo@superbrain-studio.cn'
  AND EXISTS (SELECT 1 FROM courses WHERE published = true)
  AND NOT EXISTS (
    SELECT 1 FROM posts p WHERE p.author_id = u.id
      AND p.title = '第一次系统学习 AI 工具，记录一下我的收获'
  );

INSERT INTO posts(course_id, category, title, content, author_id)
SELECT NULL, '提问',
  '请问课程里的附件在手机端怎么打开？',
  E'我在 iPhone 上点开课时里的 PDF 附件，想确认一下是直接在应用内预览还是会跳到浏览器？有同学试过吗？',
  u.id
FROM users u
WHERE u.email = 'demo@superbrain-studio.cn'
  AND NOT EXISTS (
    SELECT 1 FROM posts p WHERE p.author_id = u.id
      AND p.title = '请问课程里的附件在手机端怎么打开？'
  );

-- 5) 课时评论（第一门课第 1 节）
INSERT INTO lesson_comments(course_id, lesson_idx, author_id, kind, content)
SELECT c.id, 0, u.id, 'comment',
  '这一节讲得很清楚，尤其是最后那个实操演示，跟着做了一遍就理解了。'
FROM users u
CROSS JOIN LATERAL (
  SELECT id FROM courses WHERE published = true ORDER BY created_at LIMIT 1
) c
WHERE u.email = 'demo@superbrain-studio.cn'
  AND NOT EXISTS (
    SELECT 1 FROM lesson_comments lc
    WHERE lc.author_id = u.id AND lc.course_id = c.id AND lc.lesson_idx = 0
  );

-- 6) 连续签到记录（最近 5 天）
INSERT INTO daily_checkins(user_id, day)
SELECT u.id, ((now() AT TIME ZONE 'Asia/Shanghai')::date - g.i)
FROM users u CROSS JOIN generate_series(0, 4) AS g(i)
WHERE u.email = 'demo@superbrain-studio.cn'
ON CONFLICT DO NOTHING;

-- 7) 好友关系：与最多 3 位非管理员用户成为好友
INSERT INTO friendships(a, b, status, requester, accepted_at)
SELECT LEAST(d.id, f.id), GREATEST(d.id, f.id), 'accepted', d.id, now()
FROM (SELECT id FROM users WHERE email = 'demo@superbrain-studio.cn') d
CROSS JOIN LATERAL (
  SELECT id FROM users
  WHERE role <> 'admin' AND email <> 'demo@superbrain-studio.cn'
  ORDER BY created_at LIMIT 3
) f
ON CONFLICT DO NOTHING;

-- 8) 校验
SELECT
  (SELECT count(*) FROM course_enrollments ce JOIN users u ON u.id = ce.user_id
     WHERE u.email = 'demo@superbrain-studio.cn') AS "已加入课程",
  (SELECT count(*) FROM lesson_progress lp JOIN users u ON u.id = lp.user_id
     WHERE u.email = 'demo@superbrain-studio.cn') AS "已完成课时",
  (SELECT count(*) FROM posts p JOIN users u ON u.id = p.author_id
     WHERE u.email = 'demo@superbrain-studio.cn') AS "发帖数",
  (SELECT count(*) FROM daily_checkins dc JOIN users u ON u.id = dc.user_id
     WHERE u.email = 'demo@superbrain-studio.cn') AS "签到天数",
  (SELECT count(*) FROM friendships fr JOIN users u ON u.id IN (fr.a, fr.b)
     WHERE u.email = 'demo@superbrain-studio.cn') AS "好友数",
  (SELECT user_points(u.id) FROM users u
     WHERE u.email = 'demo@superbrain-studio.cn') AS "当前积分";
