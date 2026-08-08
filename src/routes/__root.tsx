import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/site-header";
import { AuthProvider } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

const CHUNK_ERROR_RE =
  /dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError|module script failed|Unable to preload/i;

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    // 应用更新后，WebView（尤其是 iOS）可能仍缓存旧的 index.html，
    // 导致新版本的 JS 分片加载失败。此时自动强制刷新一次即可恢复。
    if (!CHUNK_ERROR_RE.test(String(error?.message ?? ""))) return;
    try {
      const key = "chunk-reload-at";
      const last = Number(sessionStorage.getItem(key) ?? 0);
      if (Date.now() - last < 30_000) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {
      /* sessionStorage 不可用时直接刷新 */
    }
    setRecovering(true);
    const url = new URL(window.location.href);
    url.searchParams.set("_r", String(Date.now()));
    window.location.replace(url.toString());
  }, [error]);

  if (recovering) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
        正在更新到最新版本…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          页面加载失败，请重试或返回首页。
        </p>
        {error?.message && (
          <p className="mt-3 break-words rounded-md bg-muted px-3 py-2 text-left text-xs text-muted-foreground">
            {error.message}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
              if (typeof window !== "undefined") window.location.reload();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            重试
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "超脑 Studio" },
      { name: "description", content: "超脑 Studio 是一个课程学习和社群讨论平台。" },
      { name: "author", content: "超脑 Studio" },
      { property: "og:title", content: "超脑 Studio" },
      { property: "og:description", content: "超脑 Studio 是一个课程学习和社群讨论平台。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@ChaonaoStudio" },
      { name: "twitter:title", content: "超脑 Studio" },
      { name: "twitter:description", content: "超脑 Studio 是一个课程学习和社群讨论平台。" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e2b826fa-9401-4a4c-8bea-928f4c8dd1b1/id-preview-bbbc1375--69bebb8d-c7b7-4075-bba0-209eb827efa0.lovable.app-1781270825766.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e2b826fa-9401-4a4c-8bea-928f4c8dd1b1/id-preview-bbbc1375--69bebb8d-c7b7-4075-bba0-209eb827efa0.lovable.app-1781270825766.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <SiteHeader />
          <Outlet />
          <footer className="border-t border-border/60 mt-24">
            <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <span>© 超脑 Studio · 让学习成为一件愉快的事</span>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/support" className="hover:text-foreground transition-colors">技术支持</Link>
                <Link to="/privacy" className="hover:text-foreground transition-colors">隐私政策</Link>
                <Link to="/terms" className="hover:text-foreground transition-colors">用户协议</Link>
                <Link to="/account" className="hover:text-foreground transition-colors">账号设置</Link>
                <a
                  href="https://beian.miit.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  沪ICP备2025139369号
                </a>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
