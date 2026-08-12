// 成就 / 称号定义：全部由用户行为数据推导，无需额外写库
export const ACHIEVEMENTS = [
  { key: "first_post",   name: "初次发声", desc: "发布第 1 篇帖子",     icon: "✍️", metric: "posts",          need: 1 },
  { key: "poster_10",    name: "话题制造机", desc: "累计发布 10 篇帖子", icon: "📣", metric: "posts",          need: 10 },
  { key: "helper_20",    name: "热心助人", desc: "累计回帖 20 条",       icon: "🤝", metric: "replies",        need: 20 },
  { key: "learner_5",    name: "开卷有益", desc: "完成 5 节课时",        icon: "📚", metric: "lessons",        need: 5 },
  { key: "learner_30",   name: "苦学不辍", desc: "完成 30 节课时",       icon: "🎓", metric: "lessons",        need: 30 },
  { key: "creator_1",    name: "创作者",   desc: "上传 1 个视频",        icon: "🎬", metric: "videos",         need: 1 },
  { key: "creator_5",    name: "高产创作者", desc: "上传 5 个视频",      icon: "🎥", metric: "videos",         need: 5 },
  { key: "curious_10",   name: "十万个为什么", desc: "课时评论 10 条",   icon: "💬", metric: "lessonComments", need: 10 },
  { key: "quizmaster",   name: "出题官",   desc: "课堂出题 5 题",        icon: "🧩", metric: "questions",      need: 5 },
  { key: "popular_10",   name: "人气选手", desc: "累计收获 10 个赞",     icon: "❤️", metric: "likes",          need: 10 },
  { key: "streak_3",     name: "三日之约", desc: "连续打卡 3 天",        icon: "🔥", metric: "streak",         need: 3 },
  { key: "streak_7",     name: "一周不断", desc: "连续打卡 7 天",        icon: "⚡", metric: "streak",         need: 7 },
  { key: "streak_30",    name: "月度铁人", desc: "连续打卡 30 天",       icon: "🏆", metric: "streak",         need: 30 },
  { key: "social_3",     name: "小有人脉", desc: "结交 3 位好友",        icon: "👋", metric: "friends",        need: 3 },
  { key: "social_10",    name: "社交达人", desc: "结交 10 位好友",       icon: "🌐", metric: "friends",        need: 10 },
  { key: "points_500",   name: "积分猎人", desc: "总积分达到 500",       icon: "💎", metric: "points",         need: 500 },
];

// 可佩戴称号：解锁对应成就即可佩戴
export const TITLES = ACHIEVEMENTS.map((a) => ({ key: a.key, name: a.name, icon: a.icon }));

export function evaluate(metrics) {
  return ACHIEVEMENTS.map((a) => {
    const cur = Number(metrics[a.metric] || 0);
    return {
      ...a,
      progress: Math.min(cur, a.need),
      unlocked: cur >= a.need,
    };
  });
}

export function titleOf(key) {
  return TITLES.find((t) => t.key === key) || null;
}
