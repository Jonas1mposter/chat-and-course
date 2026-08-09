/**
 * 自动封禁策略：按 IP / User-Agent 指纹统计异常流量，
 * 超阈值临时阻断，并把封禁与命中写入审计日志（abuse_bans / abuse_audit_logs）。
 * 计数在内存（滑动窗口），封禁状态内存 + 数据库双写，重启后自动恢复。
 */
import { createHash } from "node:crypto";
import { q } from "./db.js";
import { issueChallenge, verifyPass, CHALLENGE_CFG } from "./challenge.js";

const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

const CFG = {
  reqPerMin: num(process.env.BAN_REQ_PER_MIN, 600),        // 单 IP 每分钟请求数
  mediaPerMin: num(process.env.BAN_MEDIA_PER_MIN, 300),    // 单 IP 每分钟媒体/签名请求
  authFailPer10Min: num(process.env.BAN_AUTHFAIL_PER_10MIN, 25),
  uaReqPerMin: num(process.env.BAN_UA_REQ_PER_MIN, 3000),  // 同一 UA 指纹（跨 IP 抓取）
  banMinutes: num(process.env.BAN_MINUTES, 60),            // 首次封禁时长
  banMaxMinutes: num(process.env.BAN_MAX_MINUTES, 1440),   // 升级上限
  // 达到硬阈值的多少比例时先做人机验证（而不是直接封禁）
  challengeRatio: Math.min(Math.max(num(process.env.CHALLENGE_RATIO, 0.5), 0.1), 0.95),
};

const ALLOW_IPS = new Set(
  (process.env.BAN_ALLOW_IPS || "127.0.0.1,::1").split(",").map((s) => s.trim()).filter(Boolean),
);

/** key -> { count, reset } */
const windows = new Map();
/** `${scope}:${value}` -> { until, reason, strikes } */
const bans = new Map();
/** 已封禁过的次数，用于时长升级 */
const strikes = new Map();
/** 需要人机验证的对象：`${scope}:${value}` -> { until, reason } */
const suspects = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of windows) if (v.reset <= now) windows.delete(k);
  for (const [k, v] of bans) if (v.until <= now) bans.delete(k);
  for (const [k, v] of suspects) if (v.until <= now) suspects.delete(k);
}, 60_000).unref?.();

export const clientIp = (req) =>
  (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    req.ip ||
    "").replace(/^::ffff:/, "");

export const uaFingerprint = (req) =>
  createHash("sha1").update(req.get("user-agent") || "unknown").digest("hex").slice(0, 16);

/** 通行证绑定的主体：IP + UA 指纹 */
export const challengeSubject = (req) => `${clientIp(req)}|${uaFingerprint(req)}`;

export const hasValidPass = (req) =>
  verifyPass(req.get("x-abuse-pass") || req.query?.pass, challengeSubject(req));

function markSuspect(scope, value, reason, req, detail) {
  const key = `${scope}:${value}`;
  const prev = suspects.get(key);
  suspects.set(key, { until: Date.now() + CHALLENGE_CFG.passMs, reason });
  if (!prev) {
    audit("challenge", {
      scope,
      value,
      reason,
      ip: req ? clientIp(req) : null,
      userAgent: req?.get?.("user-agent"),
      userId: req?.user?.sub || null,
      path: req?.originalUrl,
      detail,
    });
  }
}

function isSuspect(req) {
  const now = Date.now();
  for (const [scope, value] of [
    ["ip", clientIp(req)],
    ["ua", uaFingerprint(req)],
  ]) {
    const s = suspects.get(`${scope}:${value}`);
    if (s && s.until > now) return { scope, value, ...s };
  }
  return null;
}

export function clearSuspect(req) {
  suspects.delete(`ip:${clientIp(req)}`);
  suspects.delete(`ua:${uaFingerprint(req)}`);
}

function bump(key, windowMs) {
  const now = Date.now();
  let b = windows.get(key);
  if (!b || b.reset <= now) {
    b = { count: 0, reset: now + windowMs };
    windows.set(key, b);
  }
  b.count += 1;
  return b.count;
}

async function audit(event, fields = {}) {
  try {
    await q(
      `INSERT INTO abuse_audit_logs(event, scope, value, reason, ip, user_agent, user_id, path, detail)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        event,
        fields.scope || null,
        fields.value || null,
        fields.reason || null,
        fields.ip || null,
        fields.userAgent ? String(fields.userAgent).slice(0, 300) : null,
        fields.userId || null,
        fields.path || null,
        fields.detail ? JSON.stringify(fields.detail) : null,
      ],
    );
  } catch (e) {
    console.error("[guard] audit failed:", e.message);
  }
}

export async function banKey(scope, value, reason, req, detail) {
  if (!value) return;
  if (scope === "ip" && ALLOW_IPS.has(value)) return;
  const key = `${scope}:${value}`;
  const strike = (strikes.get(key) || 0) + 1;
  strikes.set(key, strike);
  const minutes = Math.min(CFG.banMinutes * 2 ** (strike - 1), CFG.banMaxMinutes);
  const until = Date.now() + minutes * 60_000;
  bans.set(key, { until, reason, strikes: strike });

  console.warn(`[guard] ban ${key} ${minutes}min reason=${reason}`);
  try {
    await q(
      `INSERT INTO abuse_bans(scope, value, reason, hits, strikes, expires_at)
       VALUES($1,$2,$3,$4,$5,to_timestamp($6/1000.0))`,
      [scope, value, reason, detail?.count || 0, strike, until],
    );
  } catch (e) {
    console.error("[guard] persist ban failed:", e.message);
  }
  await audit("ban", {
    scope,
    value,
    reason,
    ip: req ? clientIp(req) : null,
    userAgent: req?.get?.("user-agent"),
    userId: req?.user?.sub || null,
    path: req?.originalUrl,
    detail: { minutes, strike, ...(detail || {}) },
  });
}

export async function releaseBan({ scope, value, byUserId }) {
  bans.delete(`${scope}:${value}`);
  strikes.delete(`${scope}:${value}`);
  await q(
    `UPDATE abuse_bans SET released_at=now(), released_by=$3, expires_at=now()
      WHERE scope=$1 AND value=$2 AND released_at IS NULL AND expires_at > now()`,
    [scope, value, byUserId || null],
  );
  await audit("release", { scope, value, reason: "manual", userId: byUserId || null });
}

function activeBan(req) {
  const ip = clientIp(req);
  const ua = uaFingerprint(req);
  const now = Date.now();
  for (const [scope, value] of [
    ["ip", ip],
    ["ua", ua],
  ]) {
    const b = bans.get(`${scope}:${value}`);
    if (b && b.until > now) return { scope, value, ...b };
  }
  return null;
}

/** 启动时从数据库恢复未过期的封禁 */
export async function restoreBans() {
  try {
    const { rows } = await q(
      `SELECT scope, value, reason, strikes, expires_at
         FROM abuse_bans WHERE released_at IS NULL AND expires_at > now()`,
    );
    for (const r of rows) {
      bans.set(`${r.scope}:${r.value}`, {
        until: new Date(r.expires_at).getTime(),
        reason: r.reason,
        strikes: r.strikes,
      });
      strikes.set(`${r.scope}:${r.value}`, r.strikes);
    }
    if (rows.length) console.log(`[guard] restored ${rows.length} active bans`);
  } catch (e) {
    console.error("[guard] restore failed:", e.message);
  }
}

/**
 * 主中间件：先拦截已封禁者，再累加计数并按阈值自动封禁。
 * @param {{ kind?: 'api'|'media' }} opts
 */
export function abuseGuard({ kind = "api" } = {}) {
  return (req, res, next) => {
    const ip = clientIp(req);
    const ua = uaFingerprint(req);

    const hit = activeBan(req);
    if (hit) {
      const retry = Math.ceil((hit.until - Date.now()) / 1000);
      res.setHeader("Retry-After", String(retry));
      audit("blocked", {
        scope: hit.scope,
        value: hit.value,
        reason: hit.reason,
        ip,
        userAgent: req.get("user-agent"),
        userId: req.user?.sub || null,
        path: req.originalUrl,
      });
      return res.status(403).json({ error: "访问已被临时限制，请稍后再试", retryAfter: retry });
    }

    const passed = hasValidPass(req);
    if (passed) clearSuspect(req);

    // 已被标记为可疑但没有有效通行证 → 先做人机验证再放行
    const suspect = isSuspect(req);
    if (suspect && !passed) {
      res.setHeader("X-Challenge-Required", "1");
      audit("challenge-blocked", {
        scope: suspect.scope,
        value: suspect.value,
        reason: suspect.reason,
        ip,
        userAgent: req.get("user-agent"),
        userId: req.user?.sub || null,
        path: req.originalUrl,
      });
      return res.status(428).json({
        error: "检测到异常访问，请完成人机验证后重试",
        challengeRequired: true,
        challenge: issueChallenge(challengeSubject(req)),
      });
    }

    if (!ALLOW_IPS.has(ip)) {
      const soft = (max) => Math.max(1, Math.floor(max * CFG.challengeRatio));
      const reqCount = bump(`req|${ip}`, 60_000);
      if (reqCount > CFG.reqPerMin) {
        banKey("ip", ip, `请求速率过高（${reqCount}/分钟）`, req, { count: reqCount });
      } else if (!passed && reqCount > soft(CFG.reqPerMin)) {
        markSuspect("ip", ip, `请求速率偏高（${reqCount}/分钟）`, req, { count: reqCount });
      }
      if (kind === "media") {
        const mediaCount = bump(`media|${ip}`, 60_000);
        if (mediaCount > CFG.mediaPerMin) {
          banKey("ip", ip, `媒体请求过多（${mediaCount}/分钟）`, req, { count: mediaCount });
        } else if (!passed && mediaCount > soft(CFG.mediaPerMin)) {
          markSuspect("ip", ip, `媒体请求偏多（${mediaCount}/分钟）`, req, { count: mediaCount });
        }
      }
      const uaCount = bump(`ua|${ua}`, 60_000);
      if (uaCount > CFG.uaReqPerMin) {
        banKey("ua", ua, `同一客户端指纹请求过多（${uaCount}/分钟）`, req, {
          count: uaCount,
          userAgent: req.get("user-agent"),
        });
      } else if (!passed && uaCount > soft(CFG.uaReqPerMin)) {
        markSuspect("ua", ua, `同一客户端指纹请求偏多（${uaCount}/分钟）`, req, {
          count: uaCount,
          userAgent: req.get("user-agent"),
        });
      }
    }

    // 认证失败计数（暴力破解）
    res.on("finish", () => {
      if ((res.statusCode === 401 || res.statusCode === 403) && !ALLOW_IPS.has(ip)) {
        const fails = bump(`authfail|${ip}`, 600_000);
        if (fails > CFG.authFailPer10Min) {
          banKey("ip", ip, `认证失败过多（${fails}/10分钟）`, req, { count: fails });
        } else if (fails > Math.max(1, Math.floor(CFG.authFailPer10Min * CFG.challengeRatio))) {
          markSuspect("ip", ip, `认证失败偏多（${fails}/10分钟）`, req, { count: fails });
        }
      }
    });

    next();
  };
}

export const guardConfig = { ...CFG, challenge: CHALLENGE_CFG };

/** 供管理端查看当前处于“待验证”状态的对象 */
export function listSuspects() {
  const now = Date.now();
  return [...suspects.entries()]
    .filter(([, v]) => v.until > now)
    .map(([k, v]) => {
      const i = k.indexOf(":");
      return { scope: k.slice(0, i), value: k.slice(i + 1), reason: v.reason, until: v.until };
    });
}