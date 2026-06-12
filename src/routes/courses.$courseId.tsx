import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, PlayCircle, Clock, Users, BookOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { courses, type Course } from "@/lib/mock-data";

export const Route = createFileRoute("/courses/$courseId")({
  loader: ({ params }): { course: Course } => {
    const course = courses.find((c) => c.id === params.courseId);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.course.title} — 学社 Studio` },
          { name: "description", content: loaderData.course.description },
        ]
      : [],
  }),
  component: CourseDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">课程不存在</h1>
      <Link to="/courses" className="mt-4 inline-block text-primary hover:underline">
        返回课程列表
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">
      加载出错：{error.message}
    </div>
  ),
});

function CourseDetail() {
  const { course } = Route.useLoaderData() as { course: Course };
  const firstPlayable = course.lessonsList.findIndex((l) => l.videoUrl);
  const [activeIdx, setActiveIdx] = useState(firstPlayable >= 0 ? firstPlayable : 0);
  const activeLesson = course.lessonsList[activeIdx];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        to="/courses"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 全部课程
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="grid h-16 w-16 place-items-center rounded-2xl text-4xl"
              style={{ background: "var(--gradient-warm)" }}
            >
              {course.emoji}
            </div>
            <div>
              <div className="flex gap-2">
                <Badge variant="secondary">{course.category}</Badge>
                <Badge variant="outline">{course.level}</Badge>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {course.title}
              </h1>
            </div>
          </div>

          <p className="mt-6 text-lg text-muted-foreground">{course.description}</p>

          {activeLesson && (
            <div className="mt-8">
              <div className="overflow-hidden rounded-xl border border-border/60 bg-black">
                {activeLesson.videoUrl ? (
                  <video
                    key={activeLesson.videoUrl}
                    src={activeLesson.videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full"
                  />
                ) : (
                  <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Lock className="h-8 w-8" />
                    <span className="text-sm">该课时暂未上传视频</span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <h3 className="text-lg font-semibold">{activeLesson.title}</h3>
                <span className="text-sm text-muted-foreground">{activeLesson.duration}</span>
              </div>
            </div>
          )}

          <div className="mt-10">
            <h2 className="text-xl font-semibold">课程大纲</h2>
            <Card className="mt-4 divide-y divide-border/60 border-border/60 p-0">
              {course.lessonsList.map((l, i) => (
                <button
                  key={l.title}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={
                    "flex w-full items-center gap-4 p-4 text-left transition-colors " +
                    (i === activeIdx ? "bg-secondary/70" : "hover:bg-secondary/50")
                  }
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {l.videoUrl ? (
                    <PlayCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="flex-1 font-medium">{l.title}</span>
                  <span className="text-sm text-muted-foreground">{l.duration}</span>
                </button>
              ))}
            </Card>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Card className="border-border/60 p-6">
            <div className="text-3xl font-semibold">免费试学</div>
            <p className="mt-1 text-sm text-muted-foreground">加入后可观看全部课程</p>
            <Button className="mt-4 w-full" size="lg">
              立即加入
            </Button>
            <Button variant="outline" className="mt-2 w-full">
              收藏课程
            </Button>
            <div className="mt-6 space-y-3 text-sm">
              <Row icon={BookOpen} label="课时" value={`${course.lessons} 节`} />
              <Row icon={Clock} label="时长" value={course.duration} />
              <Row icon={Users} label="在学" value={`${course.students.toLocaleString()} 人`} />
            </div>
            <div className="mt-6 border-t border-border/60 pt-4 text-sm">
              <div className="text-muted-foreground">主讲老师</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 font-medium text-primary">
                  {course.instructor[0]}
                </div>
                <div className="font-medium">{course.instructor}</div>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}