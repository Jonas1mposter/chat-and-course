import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api, setToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "找回密码 — 超脑 Studio" },
      { name: "description", content: "通过邮箱验证码重设你的超脑 Studio 账号密码。" },
      { property: "og:title", content: "找回密码 — 超脑 Studio" },
      { property: "og:description", content: "通过邮箱验证码重设你的超脑 Studio 账号密码。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await api<{ ok: boolean; mailer: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      setNote(
        r.mailer === "sent"
          ? "如果该邮箱已注册，验证码已发送，请查收（15 分钟内有效）。"
          : "邮件通道暂未开通，验证码已记录在服务器日志中，请联系管理员获取，或让管理员直接为你重置密码。",
      );
      setStep(2);
    } catch (e: any) {
      setErr(e.message || "发送失败");
    } finally {
      setBusy(false);
    }
  };

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await api<{ token: string }>("/api/auth/reset-password", {
        method: "POST",
        body: { email, code, password },
      });
      setToken(r.token);
      await refresh();
      nav({ to: "/courses" });
    } catch (e: any) {
      setErr(e.message || "重置失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-md flex-col px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">找回密码</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        想起来了？{" "}
        <Link to="/auth" search={{ mode: "login" }} className="text-primary hover:underline">
          返回登录
        </Link>
      </p>

      <Card className="mt-8 border-border/60 p-6">
        {step === 1 ? (
          <form className="space-y-4" onSubmit={sendCode}>
            <div className="space-y-2">
              <Label htmlFor="email">注册邮箱</Label>
              <Input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "发送中…" : "发送验证码"}
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={doReset}>
            {note && <p className="text-sm text-muted-foreground">{note}</p>}
            <div className="space-y-2">
              <Label htmlFor="code">6 位验证码</Label>
              <Input
                id="code" inputMode="numeric" maxLength={6} required
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pwd">新密码（至少 6 位）</Label>
              <Input
                id="pwd" type="password" autoComplete="new-password" minLength={6} required
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "提交中…" : "重设密码并登录"}
            </Button>
            <button
              type="button"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setStep(1)}
            >
              没收到？重新发送
            </button>
          </form>
        )}
      </Card>
    </main>
  );
}