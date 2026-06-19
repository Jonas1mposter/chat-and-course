import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  liked: boolean;
  createdAt: string;
};

export const Route = createFileRoute("/videos/$videoId")({
  head: () => ({ meta: [{ title: "视频 — 超脑 Studio" }] }),
  component: VideoDetail,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">
      加载出错：{error.message}
    </main>
  ),
});

function VideoDetail() {
  const { videoId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: v, isLoading, error } = useQuery({
    queryKey: ["video", videoId],
    queryFn: () => api<Video>(`/api/videos/${videoId}`),
  });
  const like = useMutation({
    mutationFn: () => api(`/api/videos/${videoId}/like`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["video", videoId] }),
  });

  if (isLoading) return <main className="mx-auto max-w-3xl px-6 py-24 text-center text-muted-foreground">加载中…</main>;
  if (error || !v) return <main className="mx-auto max-w-3xl px-6 py-24 text-center text-muted-foreground">{error ? `加载失败：${(error as Error).message}` : "视频不存在"}</main>;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link to="/videos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> 视频墙
      </Link>

      <div className="mt-6 overflow-hidden rounded-xl bg-black">
        <video src={v.url} poster={v.coverUrl || undefined} controls className="aspect-video w-full" />
      </div>

      <h1 className="mt-6 text-2xl font-semibold leading-tight tracking-tight">{v.title}</h1>
      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
        <Link
          to="/u/$userId"
          params={{ userId: v.ownerId }}
          className="font-medium text-foreground hover:underline"
        >
          {v.author}
        </Link>
        <span>·</span>
        <span>{v.createdAt}</span>
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> {v.plays}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          variant={v.liked ? "default" : "outline"}
          size="sm"
          disabled={!user || like.isPending}
          onClick={() => user && like.mutate()}
        >
          <Heart className="mr-1 h-4 w-4" /> {v.likes}
        </Button>
      </div>

      {v.description && (
        <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/90">{v.description}</p>
      )}
    </main>
  );
}