import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Mail } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "用户协议与社区规范 — 超脑 Studio" },
      {
        name: "description",
        content:
          "超脑 Studio 的用户协议（EULA）与社区内容规范：禁止发布违规内容，提供举报、屏蔽与账号注销机制。",
      },
      { property: "og:title", content: "用户协议与社区规范 — 超脑 Studio" },
      {
        property: "og:description",
        content: "超脑 Studio 的用户协议与社区内容规范，含举报、屏蔽与账号注销说明。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回首页
      </Link>

      <h1 className="mt-6 flex items-center gap-2 text-3xl font-semibold tracking-tight">
        <FileText className="h-7 w-7 text-primary" />
        用户协议与社区规范
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        本协议由超脑 Studio 维护，适用于网页版与 iOS App。最后更新日期：2026 年 8 月 3 日。
        继续使用本服务即表示你已阅读并同意本协议。
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">1. 服务说明</h2>
        <p className="text-muted-foreground">
          超脑 Studio 提供在线课程学习、课时评论、讨论区互动等功能。我们可能会更新、调整或下线部分功能。
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">2. 账号</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>你需要对账号下的一切行为负责，请妥善保管密码。</li>
          <li>禁止冒充他人、买卖或出借账号。</li>
          <li>
            你可以随时在
            <Link to="/account" className="mx-1 text-primary hover:underline">
              账号设置
            </Link>
            中自助注销账号并删除相关数据。
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">3. 社区内容规范（零容忍）</h2>
        <p className="text-muted-foreground">
          讨论区与课时评论区属于用户生成内容。以下内容一律禁止发布，一经发现将立即删除并可能永久封禁账号：
        </p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>色情、低俗、血腥暴力内容。</li>
          <li>辱骂、骚扰、人身攻击、歧视与霸凌言论。</li>
          <li>违法违规信息、诈骗与垃圾广告。</li>
          <li>侵犯他人知识产权、隐私或肖像权的内容。</li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">4. 举报与处理机制</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>每条帖子、回复与课时评论旁均有「举报」入口。</li>
          <li>我们承诺在收到举报后 24 小时内完成核查，删除违规内容并封禁违规发布者。</li>
          <li>
            你也可以「屏蔽」某位用户，屏蔽后将不再看到该用户发布的内容；屏蔽名单可在
            <Link to="/account" className="mx-1 text-primary hover:underline">
              账号设置
            </Link>
            中管理。
          </li>
          <li>
            紧急情况可直接联系
            <a href="mailto:support@superbrain-studio.cn" className="mx-1 text-primary hover:underline">
              support@superbrain-studio.cn
            </a>
            。
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">5. 知识产权</h2>
        <p className="text-muted-foreground">
          课程视频、讲义与附件的版权归超脑 Studio 或相应讲师所有。未经许可，不得录屏、转载、二次分发或用于商业用途。
          你发布的内容仍归你所有，但你授予我们在本平台展示该内容的非独占许可。
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">6. 免责声明</h2>
        <p className="text-muted-foreground">
          本服务按“现状”提供。除法律强制规定外，我们不对因不可抗力、网络中断或第三方服务故障造成的损失承担责任。
          Apple 不是本协议的当事方，不对本 App 及其内容承担任何责任。
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">7. 联系我们</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>support@superbrain-studio.cn</span>
        </div>
        <p className="text-sm text-muted-foreground">
          另见
          <Link to="/privacy" className="mx-1 text-primary hover:underline">
            隐私政策
          </Link>
          与
          <Link to="/support" className="mx-1 text-primary hover:underline">
            技术支持
          </Link>
          。
        </p>
      </section>
    </main>
  );
}