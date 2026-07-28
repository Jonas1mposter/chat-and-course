import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Log = {
  id: string;
  email: string;
  user_name: string | null;
  method: "request" | "self_code" | "admin";
  actor_email: string | null;
  success: boolean;
  detail: string | null;
  ip: string | null;
  created_at: string;
};

const METHOD_LABEL: Record<Log["method"], string> = {
  request: "申请验证码",
  self_code: "用户自助重置",
  admin: "管理员重置",
};

export const Route = createFileRoute("/admin/passwords")({
  head: () => ({
    meta: [
      { title: "密码重置管理 — 超脑 Studio" },
      { name: "description", content: "管理员为学员重置登录密码，并查看全部密码重置日志。" },
      { property: "og:title", content: "密码重置管理 — 超脑 Studio" },
      { property: "og:description", content: "管理员为学员重置登录密码，并查看全部密码重置日志。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPasswords,
});

function AdminPasswords() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const loadLogs = () =>
    api<Log[]>("/api/admin/password-reset-logs")
      .then(setLogs)
      .catch((e) => setErr(e.message));

  useEffect(() => {
    if (user?.role === "admin") loadLogs();
  }, [user?.role]);

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setResult(null);
    setBusy(true);
    try {
      const r = await api<{ user: { email: string }; password: string }>(
        "/api/admin/reset-password",
        { method: "POST", body: { email, password: password || undefined } },
      );
      setResult({ email: r.user.email, password: r.password });
      setPassword("");
      await loadLogs();
    } catch (e: any) {
      setErr(e.message || "重置失败");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-3xl px-6 py-16 text-sm text-muted-foreground">加载中…</main>;
  if (user?.role !== "admin")
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold">仅管理员可访问</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          请先用管理员账号{" "}
          <Link to="/auth" search={{ mode: "login" }} className="text-primary hover:underline">
            登录
          </Link>
          。
        </p>
      </main>
    );

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">密码重置管理</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        为学员重置登录密码；所有重置操作都会写入下方日志。
      </p>

      <Card className="mt-8 border-border/60 p-6">
        <form className="space-y-4" onSubmit={reset}>
          <div className="space-y-2">
            <Label htmlFor="target">用户邮箱</Label>
            <Input
              id="target" type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newpwd">新密码（留空则自动生成临时密码）</Label>
            <Input
              id="newpwd" minLength={6}
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button type="submit" disabled={busy}>{busy ? "处理中…" : "重置密码"}</Button>
        </form>
        {result && (
          <div className="mt-4 rounded-md border border-border bg-muted/40 p-4 text-sm">
            已重置 <span className="font-medium">{result.email}</span> 的密码，新密码：
            <code className="ml-1 rounded bg-background px-2 py-1 font-mono">{result.password}</code>
            <p className="mt-2 text-xs text-muted-foreground">请通过安全渠道转交，并提醒对方尽快自行修改。</p>
          </div>
        )}
      </Card>

      <h2 className="mt-12 text-xl font-semibold">重置日志</h2>
      <Card className="mt-4 overflow-x-auto border-border/60">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">时间</th>
              <th className="px-4 py-3">账号</th>
              <th className="px-4 py-3">类型</th>
              <th className="px-4 py-3">操作人</th>
              <th className="px-4 py-3">结果</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-muted-foreground">暂无记录</td></tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-border/40 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {new Date(l.created_at).toLocaleString("zh-CN")}
                </td>
                <td className="px-4 py-3">{l.user_name ? `${l.user_name} · ` : ""}{l.email}</td>
                <td className="px-4 py-3">{METHOD_LABEL[l.method] ?? l.method}</td>
                <td className="px-4 py-3 text-muted-foreground">{l.actor_email || "—"}</td>
                <td className={"px-4 py-3 " + (l.success ? "text-foreground" : "text-destructive")}>
                  {l.success ? "成功" : "失败"}
                  {l.detail ? <span className="block text-xs text-muted-foreground">{l.detail}</span> : null}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{l.ip || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </main>
  );
}