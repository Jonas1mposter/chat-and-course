import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldAlert, Ban, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, setToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "账号设置 — 超脑 Studio" },
      {
        name: "description",
        content: "管理超脑 Studio 账号：查看屏蔽名单、注销账号并删除全部个人数据。",
      },
      { property: "og:title", content: "账号设置 — 超脑 Studio" },
      {
        property: "og:description",
        content: "管理屏蔽名单、注销账号并删除个人数据。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "login", redirect: "/account" } });
  }, [loading, user, navigate]);

  const blocks = useQuery({
    queryKey: ["blocks"],
    enabled: !!user,
    queryFn: () => api<{ id: string; name: string }[]>("/api/moderation/blocks"),
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unblock = async (id: string) => {
    await api(`/api/moderation/blocks/${id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["blocks"] });
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api("/api/users/me", { method: "DELETE", body: { password } });
      setToken(null);
      logout();
      navigate({ to: "/" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">加载中…</main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> 返回首页
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">账号设置</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {user.name} · {user.email}
      </p>

      <Card className="mt-8 border-border/60 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Ban className="h-5 w-5 text-muted-foreground" /> 屏蔽名单
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          被屏蔽用户发布的帖子与回复不会出现在你的时间线中。
        </p>
        <div className="mt-4 space-y-2">
          {blocks.isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
          {blocks.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">暂无屏蔽用户。</p>
          )}
          {blocks.data?.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
            >
              <span>{b.name}</span>
              <Button variant="ghost" size="sm" onClick={() => unblock(b.id)}>
                取消屏蔽
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-destructive/40 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-destructive">
          <ShieldAlert className="h-5 w-5" /> 注销账号
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          注销后，你的账号、学习记录、发帖与评论将被永久删除，且无法恢复。
        </p>

        {!confirmOpen ? (
          <Button variant="destructive" size="sm" className="mt-4" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="mr-1 h-4 w-4" /> 我要注销账号
          </Button>
        ) : (
          <div className="mt-4 space-y-3">
            <Input
              type="password"
              placeholder="请输入当前密码以确认"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={!password || deleting}
                onClick={deleteAccount}
              >
                {deleting ? "注销中…" : "确认永久删除"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
                取消
              </Button>
            </div>
          </div>
        )}
      </Card>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link to="/terms" className="hover:text-foreground">用户协议</Link>
        <span className="mx-2">·</span>
        <Link to="/privacy" className="hover:text-foreground">隐私政策</Link>
        <span className="mx-2">·</span>
        <Link to="/support" className="hover:text-foreground">技术支持</Link>
      </p>
    </main>
  );
}