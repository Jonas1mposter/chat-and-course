import { Router } from "express";
import { z } from "zod";
import { q } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const r = Router();

const ReportIn = z.object({
  targetType: z.enum(["post", "reply", "lesson_comment", "video", "user"]),
  targetId: z.string().min(1),
  reason: z.string().min(1).max(60),
  detail: z.string().max(1000).optional().nullable(),
});

// 举报内容（App Store 1.2 用户生成内容要求）
r.post("/reports", requireAuth, async (req, res) => {
  const p = ReportIn.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "举报内容不合法" });
  const { targetType, targetId, reason, detail } = p.data;
  await q(
    `INSERT INTO content_reports(reporter_id,target_type,target_id,reason,detail)
     VALUES($1,$2,$3,$4,$5)`,
    [req.user.sub, targetType, targetId, reason, detail || null],
  );
  res.json({ ok: true });
});

// 管理端：查看 / 处理举报
r.get("/reports", requireRole("admin"), async (req, res) => {
  const status = req.query.status === "resolved" ? "resolved" : "open";
  const { rows } = await q(
    `SELECT cr.*, u.name AS reporter_name, u.email AS reporter_email
       FROM content_reports cr
       LEFT JOIN users u ON u.id = cr.reporter_id
      WHERE cr.status = $1
      ORDER BY cr.created_at DESC
      LIMIT 200`,
    [status],
  );
  res.json(
    rows.map((x) => ({
      id: x.id,
      targetType: x.target_type,
      targetId: x.target_id,
      reason: x.reason,
      detail: x.detail,
      status: x.status,
      reporter: x.reporter_name || x.reporter_email || "已注销用户",
      createdAt: new Date(x.created_at).toLocaleString("zh-CN"),
    })),
  );
});

r.post("/reports/:id/resolve", requireRole("admin"), async (req, res) => {
  const action = String(req.body?.action || "reviewed").slice(0, 40);
  await q(
    `UPDATE content_reports
        SET status='resolved', resolved_at=now(), resolved_by=$2, resolution=$3
      WHERE id=$1`,
    [req.params.id, req.user.sub, action],
  );
  res.json({ ok: true });
});

// 屏蔽用户
r.get("/blocks", requireAuth, async (req, res) => {
  const { rows } = await q(
    `SELECT b.blocked_id, u.name FROM user_blocks b
       JOIN users u ON u.id = b.blocked_id
      WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
    [req.user.sub],
  );
  res.json(rows.map((x) => ({ id: x.blocked_id, name: x.name })));
});

r.post("/blocks/:userId", requireAuth, async (req, res) => {
  if (req.params.userId === req.user.sub)
    return res.status(400).json({ error: "不能屏蔽自己" });
  await q(
    `INSERT INTO user_blocks(user_id, blocked_id) VALUES($1,$2)
     ON CONFLICT DO NOTHING`,
    [req.user.sub, req.params.userId],
  );
  res.json({ ok: true, blocked: true });
});

r.delete("/blocks/:userId", requireAuth, async (req, res) => {
  await q("DELETE FROM user_blocks WHERE user_id=$1 AND blocked_id=$2", [
    req.user.sub,
    req.params.userId,
  ]);
  res.json({ ok: true, blocked: false });
});

export default r;