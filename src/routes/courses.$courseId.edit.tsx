import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CourseForm, type CourseFormValue } from "@/lib/course-form";
import type { Course } from "@/lib/mock-data";

export const Route = createFileRoute("/courses/$courseId/edit")({
  head: () => ({ meta: [{ title: "编辑课程 — 超脑 Studio" }] }),
  component: EditCourse,
});

function EditCourse() {
  const { courseId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api<Course>(`/api/courses/${courseId}`),
  });
  const upd = useMutation({
    mutationFn: (v: CourseFormValue) => api(`/api/courses/${courseId}`, { method: "PUT", body: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course", courseId] });
      navigate({ to: "/courses/$courseId", params: { courseId } });
    },
  });
  const [codes, setCodes] = useState<string[]>([]);
  const gen = useMutation({
    mutationFn: () =>
      api<{ codes: string[] }>("/api/admin/course-codes", {
        method: "POST",
        body: { courseId, count: 5, usesLeft: 1 },
      }),
    onSuccess: (d) => setCodes(d.codes),
  });

  if (loading || isLoading) return null;
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-muted-foreground">无权限</p>
        <Button asChild className="mt-4">
          <Link to="/courses">返回课程列表</Link>
        </Button>
      </main>
    );
  }
  if (!course) return <main className="mx-auto max-w-md px-6 py-24 text-center text-muted-foreground">课程不存在</main>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">编辑课程</h1>
      <div className="mt-6">
        <CourseForm
          initial={course}
          lockId
          persistKey={`edit:${courseId}`}
          submitting={upd.isPending}
          submitLabel="保存修改"
          onSubmit={(v) => upd.mutate(v)}
        />
        {upd.error && (
          <p className="mt-4 text-sm text-destructive">{(upd.error as Error).message}</p>
        )}
      </div>

      <Card className="mt-8 border-border/60 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">兑换码</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              一键生成 5 个单次可用兑换码（仅当课程勾选"需要兑换码"时生效）。
            </p>
          </div>
          <Button size="sm" variant="outline" disabled={gen.isPending} onClick={() => gen.mutate()}>
            {gen.isPending ? "生成中…" : "生成 5 个"}
          </Button>
        </div>
        {gen.error && (
          <p className="mt-3 text-sm text-destructive">{(gen.error as Error).message}</p>
        )}
        {codes.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {codes.map((c) => (
              <code key={c} className="rounded border border-border bg-muted/50 px-2 py-1 text-center text-sm font-mono">
                {c}
              </code>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}