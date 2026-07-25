import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Heart, Plus, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Post } from "@/lib/mock-data";
import { TierBadge } from "@/components/tier-badge";

const categories = ["全部", "公告", "前端开发", "产品设计", "AI 应用", "运营增长", "讨论"];

export const Route = createFileRoute("/discussions")({
  head: () => ({
    meta: [
      { title: "讨论区 — 超脑 Studio" },
      { name: "description", content: "和社群同学讨论课程、分享经验、共同进步。" },
    ],
  }),
  component: DiscussionsPage,
});

function DiscussionsPage() {
  const [cat, setCat] = useState("全部");
  const { user } = useAuth();
  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ["posts", cat],
    queryFn: () => api<Post[]>(`/api/posts?category=${encodeURIComponent(cat)}`),
  });
  const filtered = posts;
  const sorted = [...filtered].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">讨论区</h1>
          <p className="mt-2 text-muted-foreground">提问、分享、复盘 — 让经验流动起来。</p>
        </div>
        {user ? (
          <Button asChild>
            <Link to="/discussions/new">
              <Plus className="mr-1 h-4 w-4" /> 发布新帖
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/auth" search={{ mode: "login", redirect: "/discussions/new" }}>
              <Plus className="mr-1 h-4 w-4" /> 发布新帖
            </Link>
          </Button>
        )}
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          加载失败：{(error as Error).message}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={
              "rounded-full border px-3 py-1.5 text-sm transition-colors " +
              (cat === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground")
            }
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {!isLoading && sorted.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
            还没有帖子，来发布第一条
          </div>
        )}
        {sorted.map((p) => (
          <Link key={p.id} to="/discussions/$postId" params={{ postId: p.id }}>
            <Card className="flex gap-4 border-border/60 p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 font-medium text-primary">
                {p.authorAvatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {p.pinned && (
                    <Badge className="bg-accent text-accent-foreground gap-1">
                      <Pin className="h-3 w-3" /> 置顶
                    </Badge>
                  )}
                  <Badge variant="outline">{p.category}</Badge>
                  <TierBadge points={(p as any).authorPoints ?? 0} />
                  <span className="text-xs text-muted-foreground">
                    {p.author} · {p.createdAt}
                  </span>
                </div>
                <h3 className="mt-2 font-semibold leading-snug">{p.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {p.excerpt}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> {p.replies}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" /> {p.likes}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}