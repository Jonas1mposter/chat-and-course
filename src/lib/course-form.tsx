import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { Course } from "@/lib/mock-data";

export type CourseFormValue = Course & { published?: boolean };

export function CourseForm({
  initial,
  submitting,
  onSubmit,
  submitLabel,
  lockId,
}: {
  initial?: Partial<CourseFormValue>;
  submitting: boolean;
  onSubmit: (v: CourseFormValue) => void;
  submitLabel: string;
  lockId?: boolean;
}) {
  const [v, setV] = useState<CourseFormValue>({
    id: initial?.id ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    instructor: initial?.instructor ?? "",
    level: (initial?.level as Course["level"]) ?? "入门",
    duration: initial?.duration ?? "",
    lessons: initial?.lessons ?? 0,
    students: initial?.students ?? 0,
    category: initial?.category ?? "",
    emoji: initial?.emoji ?? "📘",
    lessonsList: initial?.lessonsList ?? [],
    published: initial?.published ?? false,
  });
  const set = <K extends keyof CourseFormValue>(k: K, val: CourseFormValue[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  const addLesson = () =>
    set("lessonsList", [...v.lessonsList, { title: "", duration: "" }]);
  const updLesson = (i: number, patch: Partial<{ title: string; duration: string; videoUrl: string }>) => {
    const next = v.lessonsList.slice();
    next[i] = { ...next[i], ...patch };
    set("lessonsList", next);
  };
  const rmLesson = (i: number) =>
    set("lessonsList", v.lessonsList.filter((_, idx) => idx !== i));

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => { e.preventDefault(); onSubmit({ ...v, lessons: v.lessonsList.length || v.lessons }); }}
    >
      <Card className="border-border/60 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="id">课程 ID（小写英文/数字/-）</Label>
            <Input id="id" required pattern="[a-z0-9-]+" value={v.id} disabled={lockId}
              onChange={(e) => set("id", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emoji">封面 Emoji</Label>
            <Input id="emoji" value={v.emoji} onChange={(e) => set("emoji", e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="t">标题</Label>
          <Input id="t" required value={v.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="d">简介</Label>
          <Textarea id="d" rows={3} value={v.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>分类</Label>
            <Input value={v.category} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>难度</Label>
            <select
              value={v.level}
              onChange={(e) => set("level", e.target.value as Course["level"])}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="入门">入门</option>
              <option value="进阶">进阶</option>
              <option value="高级">高级</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>时长</Label>
            <Input value={v.duration} onChange={(e) => set("duration", e.target.value)} placeholder="如 6 周" />
          </div>
          <div className="space-y-2">
            <Label>主讲</Label>
            <Input value={v.instructor} onChange={(e) => set("instructor", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="border-border/60 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">课时</h3>
          <Button type="button" variant="outline" size="sm" onClick={addLesson}>添加课时</Button>
        </div>
        <div className="mt-4 space-y-3">
          {v.lessonsList.length === 0 && (
            <p className="text-sm text-muted-foreground">还没有课时</p>
          )}
          {v.lessonsList.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_120px_1fr_auto] gap-2">
              <Input placeholder="课时标题" value={l.title}
                onChange={(e) => updLesson(i, { title: e.target.value })} />
              <Input placeholder="时长 12:30" value={l.duration}
                onChange={(e) => updLesson(i, { duration: e.target.value })} />
              <Input placeholder="视频 URL（可选）" value={l.videoUrl ?? ""}
                onChange={(e) => updLesson(i, { videoUrl: e.target.value })} />
              <Button type="button" variant="ghost" size="sm" onClick={() => rmLesson(i)}>删</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-border/60 p-6 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!v.published}
            onChange={(e) => set("published", e.target.checked)} />
          立即发布（取消勾选则保存为草稿）
        </label>
        <Button type="submit" disabled={submitting}>
          {submitting ? "保存中…" : submitLabel}
        </Button>
      </Card>
    </form>
  );
}