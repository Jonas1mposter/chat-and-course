import { cn } from "@/lib/utils";

export const TITLE_META: Record<string, { name: string; icon: string }> = {
  first_post: { name: "初次发声", icon: "✍️" },
  poster_10: { name: "话题制造机", icon: "📣" },
  helper_20: { name: "热心助人", icon: "🤝" },
  learner_5: { name: "开卷有益", icon: "📚" },
  learner_30: { name: "苦学不辍", icon: "🎓" },
  creator_1: { name: "创作者", icon: "🎬" },
  creator_5: { name: "高产创作者", icon: "🎥" },
  curious_10: { name: "十万个为什么", icon: "💬" },
  quizmaster: { name: "出题官", icon: "🧩" },
  popular_10: { name: "人气选手", icon: "❤️" },
  streak_3: { name: "三日之约", icon: "🔥" },
  streak_7: { name: "一周不断", icon: "⚡" },
  streak_30: { name: "月度铁人", icon: "🏆" },
  social_3: { name: "小有人脉", icon: "👋" },
  social_10: { name: "社交达人", icon: "🌐" },
  points_500: { name: "积分猎人", icon: "💎" },
};

export function TitleBadge({ titleKey, className }: { titleKey?: string; className?: string }) {
  const m = titleKey ? TITLE_META[titleKey] : null;
  if (!m) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/25",
        className,
      )}
    >
      <span aria-hidden>{m.icon}</span>
      {m.name}
    </span>
  );
}
