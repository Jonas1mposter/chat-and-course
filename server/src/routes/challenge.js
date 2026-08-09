import { Router } from "express";
import { z } from "zod";
import { issueChallenge, verifySolution, CHALLENGE_CFG } from "../challenge.js";
import { challengeSubject } from "../guard.js";
import { rateLimit } from "../ratelimit.js";

const r = Router();

const limiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.CHALLENGE_RATE_PER_MIN || 30),
  message: "验证请求过于频繁，请稍后再试",
});

// 主动获取一道挑战
r.get("/", limiter, (req, res) => {
  res.json({ challenge: issueChallenge(challengeSubject(req)), passMinutes: CHALLENGE_CFG.passMs / 60000 });
});

const SolveIn = z.object({
  nonce: z.string().min(1),
  ts: z.number(),
  difficulty: z.number(),
  sig: z.string().min(1),
  solution: z.union([z.string(), z.number()]),
});

// 提交解答换取通行证
r.post("/verify", limiter, (req, res) => {
  const p = SolveIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "参数不合法" });
  const out = verifySolution(p.data, challengeSubject(req));
  if (!out.ok) return res.status(400).json({ error: out.error });
  res.json({ ok: true, pass: out.pass, expiresAt: out.expiresAt });
});

export default r;
