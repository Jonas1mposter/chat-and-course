import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CourseForm, type CourseFormValue } from "@/lib/course-form";
import type { Course } from "@/lib/mock-data";

export const Route = createFileRoute("/courses/$courseId/edit")({
  head: () => ({ meta: [{ title: "编辑课程 — 学社 Studio" }] }),
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
          submitting={upd.isPending}
          submitLabel="保存修改"
          onSubmit={(v) => upd.mutate(v)}
        />
        {upd.error && (
          <p className="mt-4 text-sm text-destructive">{(upd.error as Error).message}</p>
        )}
      </div>
    </main>
  );
}