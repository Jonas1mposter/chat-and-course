import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, PlayCircle, Clock, BookOpen, Lock, MessageSquare, HelpCircle, Trash2, CheckCircle2, XCircle, Lightbulb, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useSignedMedia } from "@/hooks/use-signed-media";

function LessonVideo({ url }: { url?: string | null }) {
  const src = useSignedMedia(url);
  return (
    <video src={src} controls playsInline preload="metadata" className="aspect-video w-full" />
  );
}
import { useAuth } from "@/lib/auth";
import type { Course } from "@/lib/mock-data";
import { CourseEmoji } from "@/components/course-emoji";
import { ReportDialog } from "@/components/report-dialog";

export const Route = createFileRoute("/courses/$courseId/")({
  head: () => ({ meta: [{ title: "课程详情 — 超脑 Studio" }] }),
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
  const { courseId } = Route.useParams();
  const { user } = useAuth();
  const { data: course, isLoading, error } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => api<Course>(`/api/courses/${courseId}`),
  });

  if (isLoading) {
    return <main className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">加载中…</main>;
  }
  if (error || !course) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">
        {error ? `加载失败：${(error as Error).message}` : "课程不存在"}
      </main>
    );
  }

  return <CourseView course={course} canEdit={user?.role === "admin" || user?.role === "teacher"} />;
}

type QuizPayload = { q: string; opts: string[]; a: number; e?: string };

function parseQuiz(content: string): QuizPayload | null {
  const s = content.trim();
  if (!s.startsWith("{")) return null;
  try {
    const d = JSON.parse(s);
    if (
      d &&
      typeof d.q === "string" &&
      Array.isArray(d.opts) &&
      d.opts.every((o: unknown) => typeof o === "string") &&
      typeof d.a === "number"
    ) {
      return { q: d.q, opts: d.opts, a: d.a, e: typeof d.e === "string" ? d.e : "" };
    }
  } catch {}
  return null;
}

function QuestionCard({
  q,
  canDelete,
  onDelete,
}: {
  q: LessonComment;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const quiz = parseQuiz(q.content);
  const [picked, setPicked] = useState<number | null>(null);
  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <Card className="border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-sm">
        <HelpCircle className="h-4 w-4 text-primary" />
        <span className="font-medium">{q.authorName}</span>
        <Badge className="bg-primary text-primary-foreground">讲师提问</Badge>
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date(q.createdAt).toLocaleString()}
        </span>
        {canDelete && (
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label="删除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {!quiz ? (
        <p className="mt-2 whitespace-pre-wrap text-sm">{q.content}</p>
      ) : (
        <div className="mt-3">
          <p className="text-sm font-semibold">{quiz.q}</p>
          <div className="mt-3 space-y-2">
            {quiz.opts.map((opt, i) => {
              const isPicked = picked === i;
              const isAnswer = i === quiz.a;
              const revealed = picked !== null;
              const base =
                "flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition";
              let cls = "border-border bg-background hover:border-primary";
              if (revealed) {
                if (isAnswer) cls = "border-emerald-500/60 bg-emerald-500/10";
                else if (isPicked) cls = "border-destructive/60 bg-destructive/10";
                else cls = "border-border bg-background opacity-70";
              }
              return (
                <button
                  type="button"
                  key={i}
                  disabled={revealed}
                  onClick={() => setPicked(i)}
                  className={`${base} ${cls}`}
                >
                  <span className="font-semibold text-primary">{letters[i]}.</span>
                  <span className="flex-1">{opt}</span>
                  {revealed && isAnswer && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  {revealed && isPicked && !isAnswer && (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="mt-3 space-y-2">
              <div className="text-sm">
                {picked === quiz.a ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> 答对了
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-destructive">
                    <XCircle className="h-4 w-4" /> 答错了，正确答案是 {letters[quiz.a]}
                  </span>
                )}
              </div>
              {quiz.e && (
                <div className="flex gap-2 rounded-md border-l-2 border-amber-500/60 bg-amber-500/5 p-3 text-sm text-muted-foreground">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>{quiz.e}</span>
                </div>
              )}
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-primary"
                onClick={() => setPicked(null)}
              >
                重新作答
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function CourseView({ course, canEdit }: { course: Course; canEdit: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const firstPlayable = course.lessonsList.findIndex((l) => l.videoUrl);
  const [activeIdx, setActiveIdx] = useState(firstPlayable >= 0 ? firstPlayable : 0);
  const activeLesson = course.lessonsList[activeIdx];
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const enrolled = !!course.enrolled;

  const join = useMutation({
    mutationFn: (c?: string) =>
      api(`/api/courses/${course.id}/join`, {
        method: "POST",
        body: c ? { code: c } : {},
      }),
    onSuccess: () => {
      setShowCode(false);
      setCode("");
      qc.invalidateQueries({ queryKey: ["course", course.id] });
    },
  });

  const onJoinClick = () => {
    if (!user) return;
    if (course.requiresCode) setShowCode(true);
    else join.mutate(undefined);
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <Link
          to="/courses"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> 全部课程
        </Link>
        {canEdit && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/courses/$courseId/edit" params={{ courseId: course.id }}>编辑课程</Link>
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="grid h-16 w-16 place-items-center rounded-2xl text-4xl"
              style={{ background: "var(--gradient-warm)" }}
            >
              <CourseEmoji emoji={course.emoji} label={course.title} />
            </div>
            <div>
              <div className="flex gap-2">
                <Badge variant="secondary">{course.category}</Badge>
                <Badge variant="outline">{course.level}</Badge>
                {course.requiresCode && !enrolled && (
                  <Badge className="bg-accent text-accent-foreground">需要兑换码</Badge>
                )}
                {enrolled && (
                  <Badge className="bg-primary text-primary-foreground">已加入</Badge>
                )}
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
                  <LessonVideo key={activeLesson.videoUrl} url={activeLesson.videoUrl} />
                ) : (
                  <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Lock className="h-8 w-8" />
                    <span className="text-sm">
                      {enrolled ? "该课时暂未上传视频" : "加入课程后可观看此课时"}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <h3 className="text-lg font-semibold">{activeLesson.title}</h3>
                <span className="text-sm text-muted-foreground">{activeLesson.duration}</span>
              </div>
              {(activeLesson.attachments ?? []).length > 0 && (
                <div className="mt-3 rounded-md border border-border/60 bg-secondary/30 p-3">
                  <div className="mb-2 text-sm font-medium">课程附件</div>
                  <ul className="space-y-1 text-sm">
                    {(activeLesson.attachments ?? []).map((a, idx) => (
                      <li key={`${a.url}-${idx}`}>
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          <Paperclip className="mr-1 inline h-4 w-4" /> {a.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <LessonComments
                courseId={course.id}
                lessonIdx={activeIdx}
                canTeach={canEdit}
              />
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
                  {!l.videoUrl && !enrolled && i >= (course.previewLessons ?? 1) && (
                    <Badge variant="outline" className="text-[10px]">加入解锁</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">{l.duration}</span>
                </button>
              ))}
            </Card>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Card className="border-border/60 p-6">
            <div className="text-3xl font-semibold">
              {enrolled ? "继续学习" : course.requiresCode ? "凭码加入" : "免费试学"}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {enrolled
                ? "你已经加入本课程"
                : `未加入可试看前 ${course.previewLessons ?? 1} 节`}
            </p>
            {!user ? (
              <Button asChild className="mt-4 w-full" size="lg">
                <Link to="/auth" search={{ mode: "login", redirect: `/courses/${course.id}` }}>
                  登录后加入
                </Link>
              </Button>
            ) : enrolled ? (
              <Button className="mt-4 w-full" size="lg" disabled>已加入</Button>
            ) : showCode ? (
              <div className="mt-4 space-y-2">
                <Input
                  placeholder="输入兑换码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={!code.trim() || join.isPending}
                    onClick={() => join.mutate(code.trim())}
                  >
                    {join.isPending ? "兑换中…" : "确认兑换"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCode(false)}>取消</Button>
                </div>
              </div>
            ) : (
              <Button
                className="mt-4 w-full"
                size="lg"
                onClick={onJoinClick}
                disabled={join.isPending}
              >
                {join.isPending ? "加入中…" : course.requiresCode ? "输入兑换码" : "立即加入"}
              </Button>
            )}
            {join.error && (
              <p className="mt-2 text-sm text-destructive">{(join.error as Error).message}</p>
            )}
            <div className="mt-6 space-y-3 text-sm">
              <Row icon={BookOpen} label="课时" value={`${course.lessons} 节`} />
              <Row icon={Clock} label="时长" value={course.duration} />
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

type LessonComment = {
  id: string;
  courseId: string;
  lessonIdx: number;
  authorId: string;
  authorName: string;
  authorRole: "student" | "teacher" | "admin";
  kind: "comment" | "question";
  content: string;
  parentId: string | null;
  createdAt: string;
};

function LessonComments({
  courseId,
  lessonIdx,
  canTeach,
}: {
  courseId: string;
  lessonIdx: number;
  canTeach: boolean;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["lesson-comments", courseId, lessonIdx];
  const { data: items = [], isLoading } = useQuery<LessonComment[]>({
    queryKey: key,
    queryFn: () =>
      api<LessonComment[]>(`/api/courses/${courseId}/lessons/${lessonIdx}/comments`),
  });

  const [text, setText] = useState("");
  const [mode, setMode] = useState<"comment" | "question">("comment");

  const post = useMutation({
    mutationFn: (payload: { content: string; kind: "comment" | "question" }) =>
      api(`/api/courses/${courseId}/lessons/${lessonIdx}/comments`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: key });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      api(`/api/courses/${courseId}/lessons/${lessonIdx}/comments/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const questions = items.filter((c) => c.kind === "question");
  const comments = items.filter((c) => c.kind === "comment");

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    post.mutate({ content: v, kind: mode });
  };

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">课时讨论</h2>
        <span className="text-sm text-muted-foreground">
          {items.length} 条
        </span>
      </div>

      {questions.length > 0 && (
        <div className="mt-4 space-y-3">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              canDelete={
                !!user &&
                (user.sub === q.authorId ||
                  user.role === "admin" ||
                  canTeach)
              }
              onDelete={() => del.mutate(q.id)}
            />
          ))}
        </div>
      )}

      {user ? (
        <Card className="mt-4 border-border/60 p-4">
          {canTeach && (
            <div className="mb-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "comment" ? "default" : "outline"}
                onClick={() => setMode("comment")}
              >
                评论
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "question" ? "default" : "outline"}
                onClick={() => setMode("question")}
              >
                <HelpCircle className="mr-1 h-4 w-4" /> 出题
              </Button>
            </div>
          )}
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              mode === "question"
                ? "写下这节课要抛给同学们的问题…"
                : "说点什么，或回答讲师的问题…"
            }
            rows={3}
          />
          <div className="mt-2 flex items-center justify-between">
            {post.error ? (
              <span className="text-sm text-destructive">
                {(post.error as Error).message}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {mode === "question" ? "将以「讲师提问」的形式发布" : "支持普通文本"}
              </span>
            )}
            <Button
              size="sm"
              onClick={submit}
              disabled={!text.trim() || post.isPending}
            >
              {post.isPending ? "发送中…" : mode === "question" ? "发布问题" : "发送"}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mt-4 border-dashed p-4 text-sm text-muted-foreground">
          <Link to="/auth" search={{ mode: "login" }} className="text-primary hover:underline">
            登录
          </Link>{" "}
          后可参与讨论
        </Card>
      )}

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">加载评论…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">还没有评论，抢个沙发～</p>
        ) : (
          comments.map((c) => (
            <Card key={c.id} className="border-border/60 p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{c.authorName}</span>
                {c.authorRole !== "student" && (
                  <Badge variant="outline" className="text-[10px]">
                    {c.authorRole === "admin" ? "管理员" : "讲师"}
                  </Badge>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
                {user &&
                  (user.sub === c.authorId ||
                    user.role === "admin" ||
                    canTeach) && (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => del.mutate(c.id)}
                      aria-label="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{c.content}</p>
              <div className="mt-2 flex justify-end">
                <ReportDialog
                  targetType="lesson_comment"
                  targetId={c.id}
                  authorId={c.authorId}
                  authorName={c.authorName}
                />
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}