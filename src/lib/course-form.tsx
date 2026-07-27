import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import type { Course } from "@/lib/mock-data";
import { api, uploadFile } from "@/lib/api";

export type CourseFormValue = Course & { published?: boolean };

export function CourseForm({
  initial,
  submitting,
  onSubmit,
  submitLabel,
  lockId,
  persistKey,
}: {
  initial?: Partial<CourseFormValue>;
  submitting: boolean;
  onSubmit: (v: CourseFormValue) => void;
  submitLabel: string;
  lockId?: boolean;
  /** sessionStorage 键；不传则不做持久化 */
  persistKey?: string;
}) {
  const defaults: CourseFormValue = {
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
    requiresCode: initial?.requiresCode ?? false,
    previewLessons: initial?.previewLessons ?? 1,
    coverUrl: initial?.coverUrl ?? "",
  };
  const storageKey = persistKey ? `chaonao.course-draft.${persistKey}` : null;
  const [v, setV] = useState<CourseFormValue>(() => {
    if (!storageKey || typeof window === "undefined") return defaults;
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (raw) return { ...defaults, ...JSON.parse(raw) };
    } catch {}
    return defaults;
  });
  const dirtyRef = useRef(false);
  useEffect(() => {
    if (!storageKey) return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(v));
    } catch {}
  }, [v, storageKey]);
  const set = <K extends keyof CourseFormValue>(k: K, val: CourseFormValue[K]) =>
    setV((p) => {
      dirtyRef.current = true;
      return { ...p, [k]: val };
    });

  const addLesson = () =>
    set("lessonsList", [...v.lessonsList, { title: "", duration: "" }]);
  const updLesson = (i: number, patch: Partial<{ title: string; duration: string; videoUrl: string }>) => {
    setV((p) => {
      const next = p.lessonsList.slice();
      next[i] = { ...next[i], ...patch };
      return { ...p, lessonsList: next };
    });
  };
  const rmLesson = (i: number) =>
    setV((p) => ({ ...p, lessonsList: p.lessonsList.filter((_, idx) => idx !== i) }));

  const [uploading, setUploading] = useState<Record<number, number>>({});
  const [uploadErr, setUploadErr] = useState<Record<number, string | null>>({});

  // 上传中 or 已改动未提交 → 刷新/关闭时给个警告，避免辛苦填的内容被吞
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const uploadingCount = Object.keys(uploading).length;
      if (uploadingCount === 0 && !dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [uploading]);

  async function uploadLessonVideo(i: number, file: File) {
    setUploadErr((p) => ({ ...p, [i]: null }));
    setUploading((p) => ({ ...p, [i]: 0 }));
    try {
      // 1) 找后端拿 COS 预签名 PUT URL
      const { uploadUrl, publicUrl } = await api<{ uploadUrl: string; publicUrl: string }>(
        "/api/videos/sign-upload",
        {
          method: "POST",
          body: {
            filename: file.name,
            contentType: file.type || "video/mp4",
          },
        },
      );
      // 2) 直接 PUT 到 COS
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploading((prev) => ({ ...prev, [i]: Math.round((e.loaded / e.total) * 100) }));
          }
        };
        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            return reject(new Error(`COS 上传失败 ${xhr.status}`));
          }
          resolve();
        };
        xhr.onerror = () => reject(new Error("网络错误，上传失败"));
        xhr.onabort = () => reject(new Error("上传已取消"));
        xhr.send(file);
      });
      // 3) 把最终播放地址写回课时
      updLesson(i, { videoUrl: publicUrl });
    } catch (e) {
      setUploadErr((p) => ({ ...p, [i]: (e as Error).message }));
    } finally {
      setUploading((p) => {
        const n = { ...p };
        delete n[i];
        return n;
      });
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (storageKey) {
          try { window.sessionStorage.removeItem(storageKey); } catch {}
        }
        dirtyRef.current = false;
        onSubmit({ ...v, lessons: v.lessonsList.length || v.lessons });
      }}
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
          <Label htmlFor="cover">封面图 URL（可选）</Label>
          <Input id="cover" value={v.coverUrl ?? ""} onChange={(e) => set("coverUrl", e.target.value)} placeholder="https://..." />
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
            <div key={i} className="space-y-2 rounded-md border border-border/60 p-3">
              <div className="grid grid-cols-[1fr_120px_auto] gap-2">
                <Input placeholder="课时标题" value={l.title}
                  onChange={(e) => updLesson(i, { title: e.target.value })} />
                <Input placeholder="时长 12:30" value={l.duration}
                  onChange={(e) => updLesson(i, { duration: e.target.value })} />
                <Button type="button" variant="ghost" size="sm" onClick={() => rmLesson(i)}>删</Button>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                <Input placeholder="视频 URL（自动填充，或手动填）" value={l.videoUrl ?? ""}
                  onChange={(e) => updLesson(i, { videoUrl: e.target.value })} />
                <Input
                  type="file"
                  accept="video/*"
                  className="w-auto"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadLessonVideo(i, f);
                    e.currentTarget.value = "";
                  }}
                />
              </div>
              {uploading[i] !== undefined && (
                <div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${uploading[i]}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">上传中 {uploading[i]}%</p>
                </div>
              )}
              {uploadErr[i] && <p className="text-xs text-destructive">{uploadErr[i]}</p>}
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-border/60 p-6 space-y-4">
        <h3 className="font-semibold">访问控制</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>试看课时数</Label>
            <Input
              type="number"
              min={0}
              value={v.previewLessons ?? 1}
              onChange={(e) => set("previewLessons", Math.max(0, Number(e.target.value) || 0))}
            />
            <p className="text-xs text-muted-foreground">未加入的用户能免费看前 N 节。</p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <input type="checkbox" checked={!!v.requiresCode}
                onChange={(e) => set("requiresCode", e.target.checked)} />
              加入需要兑换码
            </Label>
            <p className="text-xs text-muted-foreground">勾选后学员必须输入你生成的码才能加入。</p>
          </div>
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