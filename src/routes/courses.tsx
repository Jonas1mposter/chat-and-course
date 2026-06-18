import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, Users, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Course } from "@/lib/mock-data";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "课程目录 — 学社 Studio" },
      { name: "description", content: "浏览全部课程：前端开发、产品设计、AI 应用、运营增长。" },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("全部");
  const { user } = useAuth();
  const canCreate = user?.role === "teacher" || user?.role === "admin";

  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api<Course[]>("/api/courses"),
  });

  const categories = ["全部", ...Array.from(new Set(courses.map((c) => c.category).filter(Boolean)))];

  const filtered = courses.filter(
    (c) =>
      (cat === "全部" || c.category === cat) &&
      (c.title.includes(q) || c.description.includes(q)),
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">课程目录</h1>
          <p className="mt-2 text-muted-foreground">
            系统化的学习路径，配合社群讨论，让进步可见。
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link to="/courses/new"><Plus className="mr-1 h-4 w-4" />新建课程</Link>
          </Button>
        )}
      </header>

      {error && (
        <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          加载失败：{(error as Error).message}
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索课程……"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
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
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Link key={c.id} to="/courses/$courseId" params={{ courseId: c.id }}>
            <Card className="group h-full overflow-hidden border-border/60 p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
              <div
                className="grid h-14 w-14 place-items-center rounded-xl text-3xl"
                style={{ background: "var(--gradient-warm)" }}
              >
                {c.emoji}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary">{c.category}</Badge>
                <Badge variant="outline">{c.level}</Badge>
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-snug group-hover:text-primary">
                {c.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {c.description}
              </p>
              <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {c.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {c.students.toLocaleString()}
                </span>
              </div>
            </Card>
          </Link>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
            {courses.length === 0 ? "还没有课程，去新建一门吧" : "没有找到匹配的课程"}
          </div>
        )}
      </div>
    </main>
  );
}