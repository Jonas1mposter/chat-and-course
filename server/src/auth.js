import jwt from "jsonwebtoken";

export const sign = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" },
  );

export const authOptional = (req, _res, next) => {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (t) {
    try {
      req.user = jwt.verify(t, process.env.JWT_SECRET);
    } catch {}
  }
  next();
};

export const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "未登录" });
  next();
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "未登录" });
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: "无权限" });
  next();
};