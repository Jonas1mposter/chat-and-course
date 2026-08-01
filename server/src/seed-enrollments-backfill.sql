-- 回填「在学人次」：把已有用户的真实学习行为转成 course_enrollments 记录
-- 用法：psql "$DATABASE_URL" -f server/src/seed-enrollments-backfill.sql

BEGIN;

-- 1) 有学习进度的用户 -> 视为已加入该课程
INSERT INTO course_enrollments (user_id, course_id)
SELECT DISTINCT lp.user_id, lp.course_id
FROM lesson_progress lp
JOIN users u ON u.id = lp.user_id
JOIN courses c ON c.id = lp.course_id
ON CONFLICT DO NOTHING;

-- 2) 在课程评论区发过言的用户 -> 视为已加入该课程
INSERT INTO course_enrollments (user_id, course_id)
SELECT DISTINCT lc.user_id, lc.course_id
FROM lesson_comments lc
JOIN users u ON u.id = lc.user_id
JOIN courses c ON c.id = lc.course_id
ON CONFLICT DO NOTHING;

-- 3) 讲师 / 管理员 -> 加入自己拥有的课程
INSERT INTO course_enrollments (user_id, course_id)
SELECT c.owner_id, c.id
FROM courses c
WHERE c.owner_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4)（可选，默认关闭）把所有导入的学员批量加入指定课程
--    需要时把下面两行的注释去掉，并把 'ai-tutorial' 换成你的课程 id
-- INSERT INTO course_enrollments (user_id, course_id)
-- SELECT u.id, 'ai-tutorial' FROM users u WHERE u.role = 'student' ON CONFLICT DO NOTHING;

COMMIT;

-- 校验结果
SELECT c.id, c.title,
       (SELECT count(*) FROM course_enrollments ce WHERE ce.course_id = c.id) AS students
FROM courses c ORDER BY students DESC;