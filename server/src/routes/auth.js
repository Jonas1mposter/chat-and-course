import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { q } from "../db.js";
import { requireAuth, sign } from "../auth.js";

const r = Router();

const RegisterIn = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(40),
  role: z.enum(["student", "teacher"]).optional(),
});

r.post("/register", async (req, res) => {
  const p = RegisterIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.message });
  const { email, password, name, role = "student" } = p.data;
  const exists = await q("SELECT 1 FROM users WHERE email=$1", [email]);
  if (exists.rowCount) return res.status(409).json({ error: "邮箱已注册" });
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await q(
    "INSERT INTO users(email,password_hash,name,role) VALUES($1,$2,$3,$4) RETURNING id,email,name,role",
    [email, hash, name, role],
  );
  const user = rows[0];
  res.json({ token: sign(user), user });
});

r.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "缺少参数" });
  const { rows } = await q(
    "SELECT id,email,name,role,password_hash FROM users WHERE email=$1",
    [email],
  );
  const u = rows[0];
  if (!u) return res.status(401).json({ error: "账号或密码错误" });
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) return res.status(401).json({ error: "账号或密码错误" });
  const user = { id: u.id, email: u.email, name: u.name, role: u.role };
  res.json({ token: sign(user), user });
});

r.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default r;