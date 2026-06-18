import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

const searchSchema = z.object({
  mode: z.enum(["login", "register"]).default("login"),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "登录 / 注册 — 超脑 Studio" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, redirect } = Route.useSearch();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, name, role);
      navigate({ to: redirect || "/courses" });
    } catch (e: any) {
      setErr(e.message || "出错了");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-md flex-col px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        {mode === "login" ? "登录超脑" : "加入超脑"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "login" ? "还没有账号？" : "已经有账号了？"}{" "}
        <Link
          to="/auth"
          search={{ mode: mode === "login" ? "register" : "login" }}
          className="text-primary hover:underline"
        >
          {mode === "login" ? "去注册" : "去登录"}
        </Link>
      </p>

      <Card className="mt-8 border-border/60 p-6">
        <form className="space-y-4" onSubmit={submit}>
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name">昵称</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email" type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码（至少 6 位）</Label>
            <Input
              id="password" type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            />
          </div>
          {mode === "register" && (
            <div className="space-y-2">
              <Label>身份</Label>
              <div className="flex gap-2">
                {(["student", "teacher"] as const).map((r) => (
                  <button
                    type="button" key={r} onClick={() => setRole(r)}
                    className={
                      "flex-1 rounded-md border px-3 py-2 text-sm transition-colors " +
                      (role === r
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground")
                    }
                  >
                    {r === "student" ? "学员" : "讲师"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">管理员需由现有管理员在数据库中授权。</p>
            </div>
          )}
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "提交中…" : mode === "login" ? "登录" : "注册并登录"}
          </Button>
        </form>
      </Card>
    </main>
  );
}