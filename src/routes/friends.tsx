import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, UserCheck, UserX, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TierBadge } from "@/components/tier-badge";
import { TitleBadge } from "@/components/title-badge";
import { CheckinCard } from "@/components/checkin-card";
import { toast } from "sonner";

type Person = { id: string; name: string; role: string; title?: string; points?: number; status?: string; requester?: string };

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "好友 — 超脑 Studio" },
      { name: "description", content: "添加同学为好友，一起打卡学习、比拼积分与称号。" },
      { property: "og:title", content: "好友 — 超脑 Studio" },
      { property: "og:description", content: "添加同学为好友，一起打卡学习、比拼积分与称号。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FriendsPage,
});

function Row({ p, right }: { p: Person; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 font-medium text-primary">
        {p.name?.trim().slice(0, 1) || "用"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/u/$userId" params={{ userId: p.id }} className="truncate font-medium hover:underline">
            {p.name}
          </Link>
          <TitleBadge titleKey={p.title} />
          {p.points != null && <TierBadge points={p.points} />}
        </div>
        <div className="text-xs text-muted-foreground">
          {p.role === "teacher" ? "讲师" : p.role === "admin" ? "管理员" : "学员"}
          {p.points != null ? ` · ${p.points} 分` : ""}
        </div>
      </div>
      {right}
    </div>
  );
}

function FriendsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");

  const friends = useQuery({ queryKey: ["friends"], queryFn: () => api<Person[]>("/api/social/friends"), enabled: !!user });
  const reqs = useQuery({
    queryKey: ["friend-requests"],
    queryFn: () => api<{ incoming: Person[]; outgoing: Person[] }>("/api/social/requests"),
    enabled: !!user,
  });
  const search = useQuery({
    queryKey: ["friend-search", query],
    queryFn: () => api<Person[]>(`/api/social/search?q=${encodeURIComponent(query)}`),
    enabled: !!user && query.length > 0,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["friends"] });
    qc.invalidateQueries({ queryKey: ["friend-requests"] });
    qc.invalidateQueries({ queryKey: ["friend-search"] });
  };

  const add = useMutation({
    mutationFn: (userId: string) => api("/api/social/request", { method: "POST", body: { userId } }),
    onSuccess: (r: any) => {
      toast.success(r?.status === "accepted" ? "已成为好友 🎉" : "好友申请已发送");
      invalidate();
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const accept = useMutation({
    mutationFn: (userId: string) => api("/api/social/accept", { method: "POST", body: { userId } }),
    onSuccess: () => { toast.success("已添加为好友 🎉"); invalidate(); },
    onError: (e) => toast.error((e as Error).message),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => api(`/api/social/${userId}`, { method: "DELETE" }),
    onSuccess: () => { toast.success("已移除"); invalidate(); },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">好友</h1>
        <p className="mt-2 text-muted-foreground">登录后才能添加好友、打卡和收集称号。</p>
        <Button className="mt-6" asChild>
          <Link to="/auth" search={{ mode: "login" }}>去登录</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-6">
        <h1 className="text-4xl font-semibold tracking-tight">好友</h1>
        <p className="mt-2 text-muted-foreground">加好友互相监督，每位好友 +3 分。</p>
      </header>

      <div className="mb-8">
        <CheckinCard />
      </div>

      <Card className="mb-8 border-border/60 p-5">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(term.trim());
          }}
        >
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="搜索用户名…" />
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        {query && (
          <div className="mt-4 space-y-2">
            {search.isLoading && <p className="text-sm text-muted-foreground">搜索中…</p>}
            {search.data?.length === 0 && <p className="text-sm text-muted-foreground">没有找到匹配的用户。</p>}
            {search.data?.map((p) => (
              <Row
                key={p.id}
                p={p}
                right={
                  p.status === "accepted" ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><UserCheck className="h-4 w-4" />已是好友</span>
                  ) : p.status === "pending" ? (
                    p.requester === user.sub ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-4 w-4" />待通过</span>
                    ) : (
                      <Button size="sm" onClick={() => accept.mutate(p.id)}>同意</Button>
                    )
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => add.mutate(p.id)}>
                      <UserPlus className="mr-1 h-4 w-4" />加好友
                    </Button>
                  )
                }
              />
            ))}
          </div>
        )}
      </Card>

      {!!reqs.data?.incoming.length && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">好友申请（{reqs.data.incoming.length}）</h2>
          <div className="space-y-2">
            {reqs.data.incoming.map((p) => (
              <Row
                key={p.id}
                p={p}
                right={
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => accept.mutate(p.id)}>同意</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove.mutate(p.id)}>拒绝</Button>
                  </div>
                }
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">我的好友（{friends.data?.length ?? 0}）</h2>
        {friends.isLoading && <p className="text-sm text-muted-foreground">加载中…</p>}
        {friends.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">还没有好友，上面搜索同学名字加一个吧。</p>
        )}
        <div className="space-y-2">
          {friends.data?.map((p) => (
            <Row
              key={p.id}
              p={p}
              right={
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(p.id)}>
                  <UserX className="h-4 w-4" />
                </Button>
              }
            />
          ))}
        </div>
        {!!reqs.data?.outgoing.length && (
          <p className="mt-4 text-xs text-muted-foreground">
            等待对方通过：{reqs.data.outgoing.map((p) => p.name).join("、")}
          </p>
        )}
      </section>
    </main>
  );
}
