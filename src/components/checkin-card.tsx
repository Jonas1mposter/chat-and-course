import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type Checkin = { streak: number; checkedToday: boolean; total: number };

export function CheckinCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["checkin"],
    queryFn: () => api<Checkin>("/api/social/checkin"),
    enabled: !!user,
  });

  const m = useMutation({
    mutationFn: () => api<Checkin & { gained: number; already: boolean }>("/api/social/checkin", { method: "POST" }),
    onSuccess: (r) => {
      toast.success(r.already ? "今天已经打过卡啦" : `打卡成功 +${r.gained} 分，连续 ${r.streak} 天`);
      qc.invalidateQueries({ queryKey: ["checkin"] });
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!user) return null;

  const days = Array.from({ length: 7 }, (_, i) => i < (data?.streak ?? 0) % 7 || (data?.streak ?? 0) >= 7);

  return (
    <Card className="flex flex-wrap items-center gap-4 border-border/60 p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-orange-500/10 text-orange-500">
          <Flame className="h-5 w-5" />
        </span>
        <div>
          <div className="text-sm font-medium">
            连续打卡 <span className="tabular-nums">{data?.streak ?? 0}</span> 天
          </div>
          <div className="text-xs text-muted-foreground">
            累计 {data?.total ?? 0} 天 · 每日 +2 分
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {days.map((on, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full ${on ? "bg-orange-500" : "bg-muted"}`}
          />
        ))}
      </div>
      <Button
        className="ml-auto"
        size="sm"
        disabled={data?.checkedToday || m.isPending}
        onClick={() => m.mutate()}
      >
        {data?.checkedToday ? "今日已打卡" : "打卡 +2"}
      </Button>
    </Card>
  );
}
