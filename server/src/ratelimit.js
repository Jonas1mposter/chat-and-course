/** 极简内存限流（滑动窗口），无需额外依赖。多进程时每进程独立计数。 */
const buckets = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
}, 60_000).unref?.();

export function rateLimit({ windowMs = 60_000, max = 120, keyFn, message = "请求过于频繁，请稍后再试" } = {}) {
  return (req, res, next) => {
    const key =
      (keyFn ? keyFn(req) : null) ||
      req.user?.sub ||
      req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
      req.ip;
    const id = `${req.baseUrl}${req.path}|${key}`;
    const now = Date.now();
    let b = buckets.get(id);
    if (!b || b.reset <= now) {
      b = { count: 0, reset: now + windowMs };
      buckets.set(id, b);
    }
    b.count += 1;
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - b.count)));
    if (b.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((b.reset - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
}
