import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CourseForm, type CourseFormValue } from "@/lib/course-form";

export const Route = createFileRoute("/courses/new")({
  head: () => ({ meta: [{ title: "新建课程 — 学社 Studio" }] }),
  component: NewCourse,
});

function NewCourse() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const create = useMutation({
    mutationFn: (v: CourseFormValue) => api("/api/courses", { method: "POST", body: v }),
    onSuccess: (_d, v) => navigate({ to: "/courses/$courseId", params: { courseId: v.id } }),
  });

  if (loading) return null;
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-muted-foreground">只有讲师 / 管理员可以新建课程</p>
        <Button asChild className="mt-4">
          <Link to="/courses">返回课程列表</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">新建课程</h1>
      <div className="mt-6">
        <CourseForm submitting={create.isPending} submitLabel="创建课程" onSubmit={(v) => create.mutate(v)} />
        {create.error && (
          <p className="mt-4 text-sm text-destructive">{(create.error as Error).message}</p>
        )}
      </div>
    </main>
  );
}