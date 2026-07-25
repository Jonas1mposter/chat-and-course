import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/setup")({
  head: () => ({ meta: [{ title: "初始化管理员 — 超脑 Studio" }] }),
  component: AdminSetup,
});

function AdminSetup() {
  const { user, loading, refresh } = useAuth();
  const nav = useNavigate();
  const [exists, setExists] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api<{ exists: boolean }>("/api/auth/admin-exists")
      .then((r) => setExists(r.exists))
      .catch((e) => setErr(e.message));
  }, []);

  const claim = async () => {
    setBusy(true);
    setErr("");
    try {
      await api("/api/auth/claim-admin", { method: "POST" });
      await refresh();
      nav({ to: "/courses" });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">初始化管理员</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        当站点还没有任何管理员时，第一个登录用户可以在这里把自己升为管理员。
      </p>
      <Card className="mt-6 border-border/60 p-6 space-y-4">
        {loading || exists === null ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : !user ? (
          <>
            <p className="text-sm">请先登录后再来领取。</p>
            <Button asChild>
              <Link to="/auth" search={{ mode: "login", redirect: "/admin/setup" }}>去登录</Link>
            </Button>
          </>
        ) : user.role === "admin" ? (
          <p className="text-sm text-primary">你已经是管理员。</p>
        ) : exists ? (
          <p className="text-sm text-muted-foreground">已经存在管理员，无法再次领取。</p>
        ) : (
          <>
            <p className="text-sm">
              当前账号：<b>{user.name}</b>（{user.email}）
            </p>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button onClick={claim} disabled={busy} className="w-full">
              {busy ? "领取中…" : "把我升为管理员"}
            </Button>
          </>
        )}
      </Card>
    </main>
  );
}