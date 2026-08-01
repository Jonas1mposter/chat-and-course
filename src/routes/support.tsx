import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, MessageCircle, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "技术支持 — 超脑 Studio" },
      {
        name: "description",
        content: "超脑 Studio 技术支持中心，获取帮助、反馈问题与联系我们。",
      },
      { property: "og:title", content: "技术支持 — 超脑 Studio" },
      {
        property: "og:description",
        content: "超脑 Studio 技术支持中心，获取帮助、反馈问题与联系我们。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const faqs = [
    {
      q: "无法播放课程视频怎么办？",
      a: "请检查网络连接，并确认使用的是最新版本浏览器。iOS App 用户请确保系统版本在 iOS 14 以上，且未开启会限制媒体流量的网络代理。",
    },
    {
      q: "忘记密码如何找回？",
      a: "在登录页点击“忘记密码”，输入注册邮箱后获取验证码即可重置。如果未收到邮件，请检查垃圾箱或联系管理员协助。",
    },
    {
      q: "如何报名课程？",
      a: "浏览课程列表后点击课程封面进入详情页，点击“开始学习”即可加入。部分课程可能需要讲师授权。",
    },
    {
      q: "如何在讨论区发帖或评论？",
      a: "登录后进入讨论区，点击“发布新帖”即可提问。在课程详情页也可以针对每节课发表评论或回答讲师提问。",
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回首页
      </Link>

      <h1 className="mt-6 flex items-center gap-2 text-3xl font-semibold tracking-tight">
        <HelpCircle className="h-7 w-7 text-primary" />
        技术支持
      </h1>

      <p className="mt-4 text-muted-foreground">
        遇到问题了？可以先查看下方的常见问题，也可以通过页面底部的方式联系我们。
      </p>

      <section className="mt-10 space-y-6">
        <h2 className="text-xl font-semibold">常见问题</h2>
        {faqs.map((item, idx) => (
          <div key={idx} className="rounded-lg border border-border/60 bg-card p-4">
            <h3 className="font-medium">{item.q}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">联系我们</h2>
        <div className="space-y-3 rounded-lg border border-border/60 bg-card p-5 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">邮箱：support@superbrain-studio.cn（示例，请替换为真实邮箱）</span>
          </div>
          <div className="flex items-center gap-3">
            <MessageCircle className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">微信：请添加客服微信（示例：SuperBrainSupport）</span>
          </div>
          <p className="text-muted-foreground">
            工作时间内通常会在 24 小时内回复。
          </p>
        </div>
      </section>

      <p className="mt-12 text-center text-sm text-muted-foreground">
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground"
        >
          沪ICP备2025139369号
        </a>
      </p>
    </main>
  );
}
