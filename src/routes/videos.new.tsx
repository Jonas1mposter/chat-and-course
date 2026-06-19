import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, getToken } from "@/lib/api";
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

  async function uploadToCOS(uploadUrl: string, f: File) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", f.type || "application/octet-stream");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`COS 上传失败 ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("网络错误（可能是 COS 桶未配置 CORS）"));
      xhr.send(f);
    });
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
      const sign = await api<{ uploadUrl: string; key: string; publicUrl: string }>(
        "/api/videos/sign-upload",
        { method: "POST", body: { filename: file.name, contentType: file.type || "application/octet-stream" } },
      );
      if (!getToken()) throw new Error("登录状态丢失，请重新登录");
      await uploadToCOS(sign.uploadUrl, file);
      const created = await api<{ id: string }>("/api/videos", {
        method: "POST",
        body: {
          title: title.trim(),
          description,
          cosKey: sign.key,
          coverUrl: coverUrl.trim(),
          sizeBytes: file.size,
        },
      });
      nav({ to: "/videos/$videoId", params: { videoId: created.id } });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/videos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> 视频墙
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">上传视频</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        视频会通过预签名 URL 直传腾讯云 COS，服务器不中转流量。
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