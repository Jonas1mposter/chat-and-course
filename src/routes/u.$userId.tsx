import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { TierBadge, type TierKey } from "@/components/tier-badge";

type Profile = {
  id: string;
  name: string;
  role: string;
  joinedAt: string;
  points: number;
  tier: TierKey;
  tierName: string;
  nextTier: string | null;
  nextMin: number | null;
  toNext: number;
  breakdown: {
    posts: number;
    replies: number;
    videos: number;
    lessons: number;
    postLikes: number;
    videoLikes: number;
  };
};

export const Route = createFileRoute("/u/$userId")({
  head: () => ({ meta: [{ title: "个人主页 — 超脑 Studio" }] }),
  component: ProfilePage,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">
      加载出错：{error.message}
    </main>
  ),
});

function ProfilePage() {
  const { userId } = Route.useParams();
  const { data: p, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => api<Profile>(`/api/users/${userId}`),
  });

  if (isLoading) return <main className="mx-auto max-w-3xl px-6 py-24 text-center text-muted-foreground">加载中…</main>;
  if (error || !p) return <main className="mx-auto max-w-3xl px-6 py-24 text-center text-muted-foreground">{error ? `加载失败：${(error as Error).message}` : "用户不存在"}</main>;

  const percent =
    p.nextMin != null
      ? Math.min(100, Math.round(((p.points - (p.nextMin - 50)) / 50) * 100)) // 视觉用，下方进度条更准确
      : 100;
  const progress = p.nextMin != null ? Math.max(0, Math.min(100, ((p.points) / p.nextMin) * 100)) : 100;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Card className="border-border/60 p-8">
        <div className="flex items-start gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary/10 text-2xl font-medium text-primary">
            {p.name?.[0] ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-semibold">{p.name}</h1>
              <TierBadge tier={p.tier} points={p.points} size="md" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {p.role === "teacher" ? "讲师" : p.role === "admin" ? "管理员" : "学员"} · 加入于 {p.joinedAt}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-semibold tabular-nums">{p.points}</span>
              <span className="ml-2 text-sm text-muted-foreground">总积分</span>
            </div>
            {p.nextTier ? (
              <span className="text-sm text-muted-foreground">
                距离 <b className="text-foreground">{p.nextTier}</b> 还差 {p.toNext} 分
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">已是最高段位</span>
            )}
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="发帖" value={p.breakdown.posts} unit="+5/篇" />
          <Stat label="评论" value={p.breakdown.replies} unit="+2/条" />
          <Stat label="上传视频" value={p.breakdown.videos} unit="+10/个" />
          <Stat label="完成课时" value={p.breakdown.lessons} unit="+3/节" />
          <Stat label="帖子收赞" value={p.breakdown.postLikes} unit="+1/赞" />
          <Stat label="视频收赞" value={p.breakdown.videoLikes} unit="+2/赞" />
        </div>

        <div className="mt-8 flex gap-3">
          <Link to="/leaderboard" className="text-sm text-primary hover:underline">
            查看排行榜 →
          </Link>
        </div>
      </Card>
    </main>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{unit}</div>
    </div>
  );
}