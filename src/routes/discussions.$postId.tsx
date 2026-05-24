import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Heart, MessageSquare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { posts, replies, type Reply } from "@/lib/mock-data";

export const Route = createFileRoute("/discussions/$postId")({
  loader: ({ params }) => {
    const post = posts.find((p) => p.id === params.postId);
    if (!post) throw notFound();
    const postReplies = replies.filter((r) => r.postId === params.postId);
    return { post, postReplies };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.post.title} — 讨论区` },
          { name: "description", content: loaderData.post.excerpt },
        ]
      : [],
  }),
  component: PostDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">帖子不存在</h1>
      <Link to="/discussions" className="mt-4 inline-block text-primary hover:underline">
        返回讨论区
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">
      加载出错：{error.message}
    </div>
  ),
});

function PostDetail() {
  const { post, postReplies } = Route.useLoaderData();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link
        to="/discussions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 讨论区
      </Link>

      <article className="mt-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{post.category}</Badge>
          {post.pinned && (
            <Badge className="bg-accent text-accent-foreground">置顶</Badge>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 font-medium text-primary">
            {post.authorAvatar}
          </div>
          <span className="font-medium text-foreground">{post.author}</span>
          <span>·</span>
          <span>{post.createdAt}</span>
        </div>

        <Card className="mt-6 whitespace-pre-line border-border/60 p-6 leading-relaxed text-foreground/90">
          {post.content}
        </Card>

        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Heart className="mr-1 h-4 w-4" /> {post.likes}
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-1 h-4 w-4" /> {post.replies}
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="mr-1 h-4 w-4" /> 分享
          </Button>
        </div>
      </article>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">
          回复 <span className="text-muted-foreground">({postReplies.length})</span>
        </h2>
        <div className="mt-4 space-y-3">
          {postReplies.map((r: Reply) => (
            <Card key={r.id} className="flex gap-3 border-border/60 p-5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 font-medium text-primary">
                {r.authorAvatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{r.author}</span>
                  <span className="text-muted-foreground">· {r.createdAt}</span>
                </div>
                <p className="mt-2 leading-relaxed text-foreground/90">{r.content}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-foreground">
                    <Heart className="h-3.5 w-3.5" /> {r.likes}
                  </button>
                  <button className="hover:text-foreground">回复</button>
                </div>
              </div>
            </Card>
          ))}
          {postReplies.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              暂无回复，来抢沙发吧
            </div>
          )}
        </div>

        <Card className="mt-6 border-border/60 p-5">
          <div className="text-sm font-medium">写下你的回复</div>
          <Textarea
            placeholder="友善表达，言之有物……"
            className="mt-3 min-h-[100px] resize-none"
          />
          <div className="mt-3 flex justify-end">
            <Button>发布回复</Button>
          </div>
        </Card>
      </section>
    </main>
  );
}