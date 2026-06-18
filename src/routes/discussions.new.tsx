import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Course } from "@/lib/mock-data";

export const Route = createFileRoute("/discussions/new")({
  head: () => ({ meta: [{ title: "发布新帖 — 超脑 Studio" }] }),
  component: NewPostPage,
});

function NewPostPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("讨论");
  const [courseId, setCourseId] = useState<string>("");

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api<Course[]>("/api/courses"),
  });

  const create = useMutation({
    mutationFn: () =>
      api<{ id: string }>("/api/posts", {
        method: "POST",
        body: { title, content, category, courseId: courseId || null },
      }),
    onSuccess: ({ id }) => navigate({ to: "/discussions/$postId", params: { postId: id } }),
  });

  if (loading) return null;
  if (!user) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-muted-foreground">请先登录</p>
        <Button asChild className="mt-4">
          <Link to="/auth" search={{ mode: "login", redirect: "/discussions/new" }}>去登录</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">发布新帖</h1>
      <Card className="mt-6 border-border/60 p-6">
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
        >
          <div className="space-y-2">
            <Label htmlFor="t">标题</Label>
            <Input id="t" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="c">分类</Label>
              <Input id="c" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">关联课程（可选）</Label>
              <select
                id="course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— 不关联 —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">正文</Label>
            <Textarea
              id="body" required rows={10}
              value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="支持换行……"
            />
          </div>
          {create.error && <p className="text-sm text-destructive">{(create.error as Error).message}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link to="/discussions">取消</Link>
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "发布中…" : "发布"}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}