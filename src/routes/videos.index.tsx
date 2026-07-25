import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play, Heart, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Video = {
  id: string;
  ownerId: string;
  author: string;
  title: string;
  description: string;
  url: string;
  coverUrl: string;
  plays: number;
  likes: number;
  createdAt: string;
};

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "视频 — 超脑 Studio" },
      { name: "description", content: "学员作品视频墙，看大家在练什么。" },
    ],
  }),
  component: VideosPage,
});

function VideosPage() {
  const { user } = useAuth();
  const { data: videos = [], isLoading, error } = useQuery({
    queryKey: ["videos"],
    queryFn: () => api<Video[]>("/api/videos"),
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">视频墙</h1>
          <p className="mt-2 text-muted-foreground">学员作品 · 实操演示 · 灵感分享。</p>
        </div>
        {user ? (
          <Button asChild>
            <Link to="/videos/new">
              <Plus className="mr-1 h-4 w-4" /> 上传视频
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/auth" search={{ mode: "login", redirect: "/videos/new" }}>
              <Plus className="mr-1 h-4 w-4" /> 上传视频
            </Link>
          </Button>
        )}
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          加载失败：{(error as Error).message}
        </div>
      )}

      {!isLoading && videos.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-20 text-center text-muted-foreground">
          还没有视频，来上传第一个
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <Link key={v.id} to="/videos/$videoId" params={{ videoId: v.id }}>
            <Card className="group overflow-hidden border-border/60 p-0 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {v.coverUrl ? (
                  <img
                    src={v.coverUrl}
                    alt={v.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground">
                    <Play className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 font-medium leading-snug">{v.title}</h3>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{v.author}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {v.plays}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" /> {v.likes}
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