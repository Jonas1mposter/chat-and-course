import { q } from "./db.js";

// 以东八区自然日计算连续打卡
export async function streakOf(uid) {
  const { rows } = await q(
    `SELECT day FROM daily_checkins WHERE user_id=$1 ORDER BY day DESC LIMIT 400`,
    [uid],
  );
  const days = rows.map((r) => new Date(r.day).toISOString().slice(0, 10));
  const todayStr = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  const checkedToday = days[0] === todayStr;
  let streak = 0;
  if (days.length) {
    let cursor = new Date(`${checkedToday ? todayStr : days[0]}T00:00:00Z`);
    const first = days[0];
    const diffFromToday =
      (Date.parse(`${todayStr}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / 86400000;
    if (diffFromToday <= 1) {
      for (const d of days) {
        if (d === cursor.toISOString().slice(0, 10)) {
          streak++;
          cursor = new Date(cursor.getTime() - 86400000);
        } else break;
      }
    }
  }
  return { streak, checkedToday, total: days.length };
}

export async function friendCount(uid) {
  const { rows } = await q(
    `SELECT count(*)::int AS n FROM friendships WHERE status='accepted' AND ($1 IN (a,b))`,
    [uid],
  );
  return rows[0].n;
}
