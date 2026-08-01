-- 从 Supabase 导出的报名数据迁移（course_enrollments.csv，共 33 条）
-- 用法：psql "$DATABASE_URL" -f server/src/seed-enrollments-import.sql

CREATE TEMP TABLE _en(user_id uuid, course_id text, joined_at timestamptz);
INSERT INTO _en VALUES
  ('c2dce5c6-072a-4e9c-a878-7e9655df64f1'::uuid,'ai-tutorial','2026-07-05 03:28:17.29942+00'::timestamptz),
  ('a716cdf6-b805-481e-bdcc-d416ae37c85e'::uuid,'ai-tutorial','2026-07-07 14:34:39.135645+00'::timestamptz),
  ('8352833d-5c4b-4917-8021-be9e7e10ee05'::uuid,'ai-tutorial','2026-07-07 16:13:05.788226+00'::timestamptz),
  ('cbf1d3ca-87be-4985-84ff-9ebddc507189'::uuid,'ai-tutorial','2026-07-08 02:11:03.304888+00'::timestamptz),
  ('5861e59b-92be-47b9-82db-fb1df3028afb'::uuid,'ai-tutorial','2026-07-08 12:34:54.962525+00'::timestamptz),
  ('6f9145f1-941e-4eff-afe5-e6414a3d0c31'::uuid,'ai-tutorial','2026-07-08 13:23:07.10287+00'::timestamptz),
  ('13bd002e-e275-4378-a045-946ac66b8e23'::uuid,'ai-tutorial','2026-07-09 07:39:16.442467+00'::timestamptz),
  ('dcaa8a4b-9b1b-4c93-9d7d-22677297e7ab'::uuid,'ai-tutorial','2026-07-09 15:54:44.167862+00'::timestamptz),
  ('708d46a7-c855-43e0-8c55-7ff01e0efaf0'::uuid,'ai-tutorial','2026-07-10 02:39:42.886169+00'::timestamptz),
  ('f3ae5035-04c6-4ad9-be8b-e4547143437d'::uuid,'workbuddy','2026-07-10 07:55:49.074+00'::timestamptz),
  ('bd2dc796-ad13-4426-a842-0508cf572f4d'::uuid,'workbuddy','2026-07-10 08:10:17.467289+00'::timestamptz),
  ('14155de0-0c98-4365-a679-ba45eca5f751'::uuid,'ai-tutorial','2026-07-10 08:34:39.519498+00'::timestamptz),
  ('bd2dc796-ad13-4426-a842-0508cf572f4d'::uuid,'ai-tutorial','2026-07-10 12:35:46.465851+00'::timestamptz),
  ('7db66309-3e5e-4a8d-afec-f4afda74fa85'::uuid,'workbuddy','2026-07-10 12:40:32.80716+00'::timestamptz),
  ('7db66309-3e5e-4a8d-afec-f4afda74fa85'::uuid,'ai-tutorial','2026-07-10 13:12:17.371183+00'::timestamptz),
  ('13bd002e-e275-4378-a045-946ac66b8e23'::uuid,'workbuddy','2026-07-11 02:28:18.465091+00'::timestamptz),
  ('4a30d9b5-c024-49c3-a874-03d70af07dde'::uuid,'ai-tutorial','2026-07-11 05:09:10.330814+00'::timestamptz),
  ('89b3c927-26f5-4136-8c8a-697104772e9b'::uuid,'workbuddy','2026-07-11 07:14:18.271221+00'::timestamptz),
  ('f273baae-6929-414e-9c21-397cd47060c5'::uuid,'ai-tutorial','2026-07-12 02:22:14.506906+00'::timestamptz),
  ('345ba5ab-27cf-40b5-8766-0dbc611bfc6a'::uuid,'ai-tutorial','2026-07-12 03:36:35.062852+00'::timestamptz),
  ('3ec6a08c-05f8-4840-ba65-e06e3a41c25a'::uuid,'workbuddy','2026-07-12 04:00:24.947289+00'::timestamptz),
  ('3ec6a08c-05f8-4840-ba65-e06e3a41c25a'::uuid,'ai-tutorial','2026-07-12 04:17:29.944383+00'::timestamptz),
  ('cbead7aa-d3b8-4d34-9aa9-35f0c254e43d'::uuid,'ai-tutorial','2026-07-12 04:43:08.127846+00'::timestamptz),
  ('436b12e3-6e45-46dc-86d5-844d9304f911'::uuid,'workbuddy','2026-07-12 05:16:32.955811+00'::timestamptz),
  ('19424d0b-75b6-4166-9eaa-b2ecc6752e86'::uuid,'ai-tutorial','2026-07-12 08:26:02.359781+00'::timestamptz),
  ('21c68b4f-6fb0-4537-a215-6c86efc56b08'::uuid,'ai-tutorial','2026-07-12 08:59:16.27565+00'::timestamptz),
  ('00b8d9e3-b170-4e21-b2ba-2a418c4d1b0b'::uuid,'ai-tutorial','2026-07-12 10:05:47.512436+00'::timestamptz),
  ('89b3c927-26f5-4136-8c8a-697104772e9b'::uuid,'ai-tutorial','2026-07-12 10:16:34.171604+00'::timestamptz),
  ('1f65135b-c7e3-43ba-9de5-d0d3f86df192'::uuid,'ai-tutorial','2026-07-12 15:20:06.284807+00'::timestamptz),
  ('a446bff2-da9e-4375-83fc-7957c6d38bd3'::uuid,'ai-tutorial','2026-07-12 15:58:42.639301+00'::timestamptz),
  ('07bf299b-da63-42ea-8a92-107fdb783754'::uuid,'workbuddy','2026-07-12 16:12:13.08741+00'::timestamptz),
  ('eb1c2641-f469-45f2-a116-010b30de9602'::uuid,'ai-tutorial','2026-07-15 05:37:57.085644+00'::timestamptz),
  ('8167d66d-86e0-4303-87cb-c170168e384e'::uuid,'ai-tutorial','2026-07-21 07:20:49.251744+00'::timestamptz);

-- 只导入用户和课程都存在的记录，避免外键报错
INSERT INTO course_enrollments(user_id, course_id, joined_at)
SELECT e.user_id, e.course_id, e.joined_at
FROM _en e
JOIN users u ON u.id = e.user_id
JOIN courses c ON c.id = e.course_id
ON CONFLICT (user_id, course_id) DO UPDATE SET joined_at = EXCLUDED.joined_at;

-- 被跳过的记录（用户或课程不存在）
SELECT e.*, (u.id IS NULL) AS missing_user, (c.id IS NULL) AS missing_course
FROM _en e
LEFT JOIN users u ON u.id = e.user_id
LEFT JOIN courses c ON c.id = e.course_id
WHERE u.id IS NULL OR c.id IS NULL;

-- 结果核对
SELECT c.id, c.title,
       (SELECT count(*) FROM course_enrollments ce WHERE ce.course_id = c.id) AS students
FROM courses c ORDER BY students DESC;
