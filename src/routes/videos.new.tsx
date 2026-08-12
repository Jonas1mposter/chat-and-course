import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, uploadFile } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/videos/new")({
  head: () => ({ meta: [{ title: "上传视频 — 超脑 Studio" }] }),
  component: NewVideoPage,
});

function NewVideoPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-muted-foreground">请先登录后再上传视频。</p>
        <Button asChild className="mt-4">
          <Link to="/auth" search={{ mode: "login", redirect: "/videos/new" }}>去登录</Link>
        </Button>
      </main>
    );
  }

  async function submit() {
    if (!file || !title.trim()) {
      setErr("请填写标题并选择视频文件");
      return;
    }
    setErr(null);
    setBusy(true);
    setProgress(0);
    try {
      let finalCoverUrl = coverUrl.trim();
      if (coverFile) {
        setCoverBusy(true);
        const sc = await uploadFile<{ key: string; publicUrl: string }>(
          "/api/videos/upload-cover",
          coverFile,
        );
        finalCoverUrl = sc.publicUrl;
        setCoverBusy(false);
      }
      const res = await uploadFile<{ key: string; publicUrl: string; sizeBytes: number }>(
        "/api/videos/upload",
        file,
        (p) => setProgress(p),
      );
      const created = await api<{ id: string }>("/api/videos", {
        method: "POST",
        body: {
          title: title.trim(),
          description,
          cosKey: res.key,
          coverUrl: finalCoverUrl,
          sizeBytes: res.sizeBytes ?? file.size,
        },
      });
      nav({ to: "/videos/$videoId", params: { videoId: created.id } });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      setCoverBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/videos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> 视频墙
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">上传视频</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        视频上传后需管理员审核通过，才会出现在视频墙（你可以在视频墙看到自己「审核中」的作品）。
      </p>

      <Card className="mt-6 space-y-4 p-6">
        <div>
          <Label htmlFor="t">标题</Label>
          <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="给作品起个名字" />
        </div>
        <div>
          <Label htmlFor="d">简介（可选）</Label>
          <Textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="拍了啥 / 怎么做的 / 想交流什么" />
        </div>
        <div>
          <Label htmlFor="c">封面图 URL（可选）</Label>
          <Input id="c" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <Label htmlFor="cf">或直接上传封面图（可选，会覆盖上面的 URL）</Label>
          <Input
            id="cf"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          />
          {coverBusy && <p className="mt-1 text-xs text-muted-foreground">封面上传中…</p>}
        </div>
        <div>
          <Label htmlFor="f">视频文件</Label>
          <Input
            id="f"
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file && (
            <p className="mt-2 text-xs text-muted-foreground">
              {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          )}
        </div>

        {busy && (
          <div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">上传中 {progress}%</p>
          </div>
        )}

        {err && <p className="text-sm text-destructive">{err}</p>}

        <Button onClick={submit} disabled={busy} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          {busy ? "上传中…" : "开始上传"}
        </Button>
      </Card>
    </main>
  );
}