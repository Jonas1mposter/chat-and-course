import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Shield, Mail } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "隐私政策 — 超脑 Studio" },
      {
        name: "description",
        content: "超脑 Studio 的隐私政策，说明我们如何收集、使用和保护您的个人信息。",
      },
      { property: "og:title", content: "隐私政策 — 超脑 Studio" },
      {
        property: "og:description",
        content: "超脑 Studio 的隐私政策，说明我们如何收集、使用和保护您的个人信息。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回首页
      </Link>

      <h1 className="mt-6 flex items-center gap-2 text-3xl font-semibold tracking-tight">
        <Shield className="h-7 w-7 text-primary" />
        隐私政策
      </h1>

      <p className="mt-4 text-sm text-muted-foreground">
        本页面由超脑 Studio 维护，用于回答常见的安全与隐私问题。最后更新日期：2026 年 8 月 1 日。
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">1. 我们收集哪些信息</h2>
        <p className="text-muted-foreground">
          当您注册、登录、学习课程或在讨论区参与互动时，我们可能会收集以下信息：
        </p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>账户信息：邮箱、姓名/昵称、角色（学员/讲师/管理员）。</li>
          <li>学习数据：课程观看进度、加入的课程、评论与提问内容。</li>
          <li>技术信息：设备类型、浏览器版本、IP 地址、访问日志。</li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">2. 我们如何使用这些信息</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>提供课程学习、评论互动、排行榜等核心功能。</li>
          <li>记录学习进度，以便您在不同设备间继续学习。</li>
          <li>排查技术问题、保障服务安全与稳定运行。</li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">3. 数据存储与安全</h2>
        <p className="text-muted-foreground">
          数据存储在我们自己维护的服务器上，位于中国大陆。账户密码采用加盐哈希存储，不会以明文形式保存。敏感接口使用 JWT Token 鉴权，并通过 HTTPS 加密传输。
        </p>
        <p className="text-muted-foreground">
          请注意：任何在线服务都无法保证 100% 绝对安全。我们会持续采取合理的管理、技术与物理措施来保护您的数据。
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">4. 第三方服务</h2>
        <p className="text-muted-foreground">
          当前我们使用腾讯云对象存储（COS）与 CDN 来分发视频等大文件，相关访问受腾讯云服务条款与隐私政策约束。
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">5. 您的权利</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>您可以通过“个人主页”查看和修改昵称等基本信息。</li>
          <li>如需删除账户或导出个人数据，请联系技术支持。</li>
          <li>您有权随时停止使用本服务。</li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">6. 联系我们</h2>
        <p className="text-muted-foreground">
          如有隐私相关问题，请通过以下方式联系：
        </p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>support@superbrain-studio.cn（示例邮箱，请替换为真实联系方式）</span>
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
