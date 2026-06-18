import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { BookOpen, MessageSquare, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const navItems = [
  { to: "/", label: "首页", icon: Home },
  { to: "/courses", label: "课程", icon: BookOpen },
  { to: "/discussions", label: "讨论区", icon: MessageSquare },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>超脑 Studio</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {user.name}
                <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-xs">
                  {user.role === "admin" ? "管理员" : user.role === "teacher" ? "讲师" : "学员"}
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
              >
                退出
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth" search={{ mode: "login" }}>登录</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth" search={{ mode: "register" }}>加入社群</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}