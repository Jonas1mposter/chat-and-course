import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { TitleBadge } from "@/components/title-badge";
import { CheckinCard } from "@/components/checkin-card";
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
  title?: string;
  streak: number;
  checkedToday: boolean;
  checkinTotal: number;
  friends: number;
  achievements: {
    key: string;
    name: string;
    desc: string;
    icon: string;
    need: number;
    progress: number;
    unlocked: boolean;
  }[];
  breakdown: {
    posts: number;
    replies: number;
    videos: number;
    lessons: number;
    enrollments: number;
    lessonComments: number;
    questions: number;
    replyLikes: number;
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
  const { user } = useAuth();
  const qc = useQueryClient();
  const isSelf = user?.sub === userId;
  const { data: p, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => api<Profile>(`/api/users/${userId}`),
  });

  const setTitle = useMutation({
    mutationFn: (key: string) => api("/api/social/title", { method: "POST", body: { key } }),
    onSuccess: () => {
      toast.success("称号已更新");
      qc.invalidateQueries({ queryKey: ["user", userId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const addFriend = useMutation({
    mutationFn: () => api("/api/social/request", { method: "POST", body: { userId } }),
    onSuccess: (r: any) => toast.success(r?.status === "accepted" ? "已成为好友 🎉" : "好友申请已发送"),
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading) return <main className="mx-auto max-w-3xl px-6 py-24 text-center text-muted-foreground">加载中…</main>;
  if (error || !p) return <main className="mx-auto max-w-3xl px-6 py-24 text-center text-muted-foreground">{error ? `加载失败：${(error as Error).message}` : "用户不存在"}</main>;

  const percent =
    p.nextMin != null
      ? Math.min(100, Math.round(((p.points - (p.nextMin - 50)) / 50) * 100)) // 视觉用，下方进度条更准确
      : 100;
  const progress = p.nextMin != null ? Math.max(0, Math.min(100, ((p.points) / p.nextMin) * 100)) : 100;
  const initial = p.name?.trim().slice(0, 1) || "用";

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Card className="border-border/60 p-8">
        <div className="flex items-start gap-5">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary/10 text-2xl font-medium text-primary">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-semibold">{p.name}</h1>
              <TierBadge tier={p.tier} points={p.points} size="md" />
              <TitleBadge titleKey={p.title} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {p.role === "teacher" ? "讲师" : p.role === "admin" ? "管理员" : "学员"} · 加入于 {p.joinedAt}
              {" · "}🔥 连续 {p.streak ?? 0} 天 · 👥 {p.friends ?? 0} 位好友
            </p>
          </div>
          {user && !isSelf && (
            <Button size="sm" variant="secondary" onClick={() => addFriend.mutate()} disabled={addFriend.isPending}>
              加好友
            </Button>
          )}
        </div>

        {isSelf && (
          <div className="mt-6">
            <CheckinCard />
          </div>
        )}

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
          <Stat label="发帖" value={p.breakdown.posts} unit="+10/篇" />
          <Stat label="回帖" value={p.breakdown.replies} unit="+3/条" />
          <Stat label="课时评论" value={p.breakdown.lessonComments ?? 0} unit="+3/条" />
          <Stat label="课堂出题" value={p.breakdown.questions ?? 0} unit="+8/题" />
          <Stat label="上传视频" value={p.breakdown.videos} unit="+15/个" />
          <Stat label="完成课时" value={p.breakdown.lessons} unit="+5/节" />
          <Stat label="报名课程" value={p.breakdown.enrollments ?? 0} unit="+5/门" />
          <Stat label="帖子收赞" value={p.breakdown.postLikes} unit="+2/赞" />
          <Stat label="回帖收赞" value={p.breakdown.replyLikes ?? 0} unit="+2/赞" />
          <Stat label="视频收赞" value={p.breakdown.videoLikes} unit="+3/赞" />
        </div>

        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">
            成就 <span className="text-sm font-normal text-muted-foreground">
              {p.achievements?.filter((a) => a.unlocked).length ?? 0}/{p.achievements?.length ?? 0}
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {p.achievements?.map((a) => (
              <div
                key={a.key}
                className={`rounded-lg border p-3 transition-colors ${
                  a.unlocked ? "border-primary/40 bg-primary/5" : "border-border/60 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden>{a.icon}</span>
                  <span className="text-sm font-medium">{a.name}</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{a.desc}</div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, (a.progress / a.need) * 100)}%` }}
                  />
                </div>
                {isSelf && a.unlocked && (
                  <button
                    onClick={() => setTitle.mutate(p.title === a.key ? "" : a.key)}
                    className="mt-2 text-[11px] text-primary hover:underline"
                  >
                    {p.title === a.key ? "取消佩戴" : "佩戴称号"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link to="/leaderboard" className="text-sm text-primary hover:underline">
            查看排行榜 →
          </Link>
          <Link to="/friends" className="text-sm text-primary hover:underline">
            好友与打卡 →
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