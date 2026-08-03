import { useState } from "react";
import { Flag, Ban, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export type ReportTarget = "post" | "reply" | "lesson_comment" | "video" | "user";

const REASONS = [
  "垃圾广告",
  "辱骂或人身攻击",
  "色情低俗",
  "违法违规",
  "侵犯他人权益",
  "其他",
];

/** 举报 / 屏蔽入口：满足 App Store 1.2 对用户生成内容的要求 */
export function ReportDialog({
  targetType,
  targetId,
  authorId,
  authorName,
}: {
  targetType: ReportTarget;
  targetId: string;
  authorId?: string | null;
  authorName?: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setState("sending");
    setError(null);
    try {
      await api("/api/moderation/reports", {
        method: "POST",
        body: { targetType, targetId, reason, detail: detail.trim() || null },
      });
      setState("done");
    } catch (e) {
      setError((e as Error).message);
      setState("idle");
    }
  };

  const block = async () => {
    if (!authorId) return;
    setError(null);
    try {
      await api(`/api/moderation/blocks/${authorId}`, { method: "POST" });
      setBlocked(true);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setState("idle");
          setDetail("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          aria-label="举报此内容"
        >
          <Flag className="h-3.5 w-3.5" /> 举报
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>举报内容</DialogTitle>
          <DialogDescription>
            我们会在 24 小时内处理举报，并对违规内容进行删除、对发布者采取限制措施。
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <p className="text-sm text-muted-foreground">请先登录后再举报。</p>
        ) : state === "done" ? (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Check className="h-4 w-4 text-primary" /> 举报已提交，感谢你的反馈。
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => setReason(x)}
                  className={
                    "rounded-md border px-3 py-2 text-sm transition-colors " +
                    (reason === x
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground")
                  }
                >
                  {x}
                </button>
              ))}
            </div>
            <Textarea
              placeholder="补充说明（选填）"
              className="min-h-[80px] resize-none"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {authorId && user && authorId !== user.sub ? (
            <Button variant="outline" size="sm" onClick={block} disabled={blocked}>
              <Ban className="mr-1 h-4 w-4" />
              {blocked ? "已屏蔽" : `屏蔽${authorName ? ` ${authorName}` : "此用户"}`}
            </Button>
          ) : (
            <span />
          )}
          {state === "done" || !user ? (
            <Button size="sm" onClick={() => setOpen(false)}>
              关闭
            </Button>
          ) : (
            <Button size="sm" onClick={submit} disabled={state === "sending"}>
              {state === "sending" ? "提交中…" : "提交举报"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
