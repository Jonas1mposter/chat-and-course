import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Video = {
  id: string;
  author: string;
  title: string;
  description: string;
  coverUrl: string;
  status: string;
  createdAt: string;
};

const TABS = [
  { key: "pending", label: "待审核" },
  { key: "approved", label: "已通过" },
  { key: "rejected", label: "已拒绝" },
] as const;

export const Route = createFileRoute("/admin/videos")({
  head: () => ({
    meta: [
      { title: "视频审核 — 超脑 Studio" },
      { name: "description", content: "管理员审核学员上传的视频作品。" },
      { property: "og:title", content: "视频审核 — 超脑 Studio" },
      { property: "og:description", content: "管理员审核学员上传的视频作品。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminVideosPage,
});

function AdminVideosPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("pending");

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["admin-videos", tab],
    queryFn: () => api<Video[]>(`/api/videos/admin/pending?status=${tab}`),
    enabled: user?.role === "admin",
  });

  const review = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "reject" }) =>
      api(`/api/videos/${v.id}/review`, { method: "POST", body: { action: v.action } }),
    onSuccess: (_d, v) => {
      toast.success(v.action === "approve" ? "已通过" : "已拒绝");
      qc.invalidateQueries({ queryKey: ["admin-videos"] });
      qc.invalidateQueries({ queryKey: ["videos"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/videos/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("已删除");
      qc.invalidateQueries({ queryKey: ["admin-videos"] });
      qc.invalidateQueries({ queryKey: ["videos"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (user?.role !== "admin")
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center text-muted-foreground">
        仅管理员可访问。
      </main>
    );

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">视频审核</h1>
      <p className="mt-2 text-sm text-muted-foreground">学员上传的视频需通过审核后才会出现在视频墙。</p>

      <div className="mt-6 flex gap-2">
        {TABS.map((t) => (
          <Button key={t.key} size="sm" variant={tab === t.key ? "default" : "outline"} onClick={() => setTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-muted-foreground">加载中…</p>}
      {!isLoading && videos.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          暂无内容
        </div>
      )}

      <div className="mt-6 space-y-3">
        {videos.map((v) => (
          <Card key={v.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <Link
                to="/videos/$videoId"
                params={{ videoId: v.id }}
                className="font-medium hover:underline"
              >
                {v.title}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                {v.author} · {v.createdAt}
              </p>
              {v.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{v.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              {v.status !== "approved" && (
                <Button size="sm" disabled={review.isPending} onClick={() => review.mutate({ id: v.id, action: "approve" })}>
                  通过
                </Button>
              )}
              {v.status !== "rejected" && (
                <Button size="sm" variant="outline" disabled={review.isPending} onClick={() => review.mutate({ id: v.id, action: "reject" })}>
                  拒绝
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                disabled={remove.isPending}
                onClick={() => {
                  if (confirm(`确定删除「${v.title}」？`)) remove.mutate(v.id);
                }}
              >
                删除
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}