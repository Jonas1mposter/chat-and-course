import { cn } from "@/lib/utils";

export type TierKey = "bronze" | "silver" | "gold" | "platinum" | "diamond";

const META: Record<TierKey, { name: string; cls: string }> = {
  bronze:   { name: "青铜", cls: "bg-amber-700/15  text-amber-700  ring-amber-700/30" },
  silver:   { name: "白银", cls: "bg-slate-400/15  text-slate-500  ring-slate-400/40" },
  gold:     { name: "黄金", cls: "bg-yellow-400/15 text-yellow-600 ring-yellow-500/40" },
  platinum: { name: "铂金", cls: "bg-cyan-400/15   text-cyan-600   ring-cyan-500/40" },
  diamond:  { name: "钻石", cls: "bg-blue-500/15   text-blue-600   ring-blue-500/40" },
};

export function tierFromPoints(points: number): TierKey {
  if (points >= 1500) return "diamond";
  if (points >= 500) return "platinum";
  if (points >= 200) return "gold";
  if (points >= 50) return "silver";
  return "bronze";
}

export function TierBadge({
  tier,
  points,
  size = "sm",
  className,
}: {
  tier?: TierKey;
  points?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const k = tier ?? (points != null ? tierFromPoints(points) : "bronze");
  const m = META[k];
  return (
    <span
      title={points != null ? `${m.name} · ${points} 分` : m.name}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        m.cls,
        className,
      )}
    >
      <span aria-hidden>◆</span>
      {m.name}
    </span>
  );
}