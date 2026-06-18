import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, MessageSquare, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { courses, posts } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "超脑 Studio — 学习、讨论、一起成长" },
      {
        name: "description",
        content: "一个集课程学习、社区讨论于一体的成长型学习社群。",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const featured = courses.slice(0, 3);
  const hotPosts = posts.slice(0, 3);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-90"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div
          className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--gradient-warm)" }}
        />
        <div className="mx-auto max-w-6xl px-6 py-24 text-primary-foreground">
          <Badge className="bg-primary-foreground/15 text-primary-foreground border-none backdrop-blur">
            <Sparkles className="mr-1 h-3 w-3" /> 学习型社群 · 持续更新中
          </Badge>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
            和一群认真的人，<br />
            把一件事学透。
          </h1>
          <p className="mt-6 max-w-xl text-lg text-primary-foreground/80">
            精选课程、真实讨论、可复用的实战经验。在这里，每一次提问都会被认真对待。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/courses">
                浏览课程 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/discussions">逛逛讨论区</Link>
            </Button>
          </div>

          <div className="mt-16 grid max-w-2xl grid-cols-3 gap-8 text-primary-foreground/90">
            {[
              { icon: BookOpen, n: "40+", l: "精品课程" },
              { icon: Users, n: "12k+", l: "学习同伴" },
              { icon: MessageSquare, n: "8.6k", l: "高质量讨论" },
            ].map((s) => (
              <div key={s.l}>
                <s.icon className="h-5 w-5 text-primary-foreground/70" />
                <div className="mt-3 text-3xl font-semibold">{s.n}</div>
                <div className="text-sm text-primary-foreground/70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured courses */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">精选课程</h2>
            <p className="mt-2 text-muted-foreground">系统化、可落地、有人陪你一起学。</p>
          </div>
          <Link
            to="/courses"
            className="text-sm font-medium text-primary hover:underline"
          >
            全部课程 →
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {featured.map((c) => (
            <Link key={c.id} to="/courses/$courseId" params={{ courseId: c.id }}>
              <Card className="group h-full overflow-hidden border-border/60 p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]">
                <div
                  className="grid h-14 w-14 place-items-center rounded-xl text-3xl"
                  style={{ background: "var(--gradient-warm)" }}
                >
                  {c.emoji}
                </div>
                <Badge variant="secondary" className="mt-4">
                  {c.category}
                </Badge>
                <h3 className="mt-3 text-xl font-semibold leading-snug group-hover:text-primary">
                  {c.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {c.description}
                </p>
                <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.instructor} · {c.level}</span>
                  <span>{c.students.toLocaleString()} 人在学</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Hot discussions */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">最近在聊</h2>
              <p className="mt-2 text-muted-foreground">真实问题、真实经验、真实回应。</p>
            </div>
            <Link
              to="/discussions"
              className="text-sm font-medium text-primary hover:underline"
            >
              全部讨论 →
            </Link>
          </div>
          <div className="mt-10 space-y-3">
            {hotPosts.map((p) => (
              <Link key={p.id} to="/discussions/$postId" params={{ postId: p.id }}>
                <Card className="flex items-center gap-4 border-border/60 p-5 transition-colors hover:bg-card">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 font-medium text-primary">
                    {p.authorAvatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {p.pinned && (
                        <Badge className="bg-accent text-accent-foreground">置顶</Badge>
                      )}
                      <Badge variant="outline">{p.category}</Badge>
                    </div>
                    <h3 className="mt-2 truncate font-medium">{p.title}</h3>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {p.excerpt}
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
                    <div>{p.replies} 回复</div>
                    <div className="mt-1">{p.createdAt}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
