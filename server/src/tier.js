// 段位规则：积分 → 段位
export const TIERS = [
  { key: "bronze",   name: "青铜", min: 0,    color: "#a16207" },
  { key: "silver",   name: "白银", min: 50,   color: "#9ca3af" },
  { key: "gold",     name: "黄金", min: 200,  color: "#eab308" },
  { key: "platinum", name: "铂金", min: 500,  color: "#06b6d4" },
  { key: "diamond",  name: "钻石", min: 1500, color: "#3b82f6" },
];

export function tierOf(points) {
  const p = Number(points) || 0;
  let cur = TIERS[0];
  let next = null;
  for (let i = 0; i < TIERS.length; i++) {
    if (p >= TIERS[i].min) {
      cur = TIERS[i];
      next = TIERS[i + 1] || null;
    }
  }
  return {
    points: p,
    tier: cur.key,
    tierName: cur.name,
    color: cur.color,
    nextTier: next?.name ?? null,
    nextMin: next?.min ?? null,
    toNext: next ? Math.max(0, next.min - p) : 0,
  };
}