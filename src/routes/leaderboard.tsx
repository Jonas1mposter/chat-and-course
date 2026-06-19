import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { TierBadge, type TierKey } from "@/components/tier-badge";

type Row = {
  id: string;
  name: string;
  role: string;
  points: number;
  tier: TierKey;
  tierName: string;
};

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "排行榜 — 超脑 Studio" },
      { name: "description", content: "积分越高，段位越高。看看谁在最前面。" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => api<Row[]>("/api/users/leaderboard"),
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">排行榜</h1>
        <p className="mt-2 text-muted-foreground">
          发帖、上传视频、完成课程都能涨分。
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          加载失败：{(error as Error).message}
        </div>
      )}

      <Card className="divide-y divide-border border-border/60 p-0">
        {isLoading && <div className="p-6 text-center text-muted-foreground">加载中…</div>}
        {data.map((u, i) => (
          <Link
            key={u.id}
            to="/u/$userId"
            params={{ userId: u.id }}
            className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40"
          >
            <div
              className={
                "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold " +
                (i === 0
                  ? "bg-yellow-400/20 text-yellow-600"
                  : i === 1
                    ? "bg-slate-400/20 text-slate-500"
                    : i === 2
                      ? "bg-amber-700/20 text-amber-700"
                      : "bg-muted text-muted-foreground")
              }
            >
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{u.name}</span>
                <TierBadge tier={u.tier} points={u.points} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{u.role}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold tabular-nums">{u.points}</div>
              <div className="text-xs text-muted-foreground">积分</div>
            </div>
          </Link>
        ))}
        {!isLoading && data.length === 0 && (
          <div className="p-10 text-center text-muted-foreground">暂无数据</div>
        )}
      </Card>
    </main>
  );
}