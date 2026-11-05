import { Router } from "express";
import { requireSession } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/admin.js";
import { parseManualUsers, isCmsAdmin } from "../utils/session.js";
import { hashPassword } from "../models/userModel.js";
import { supabaseRequest } from "../config/supabase.js";

const router = Router();
router.use(requireSession, requireAdmin);
router.get("/", async (req, res) => {
  const result = await supabaseRequest("GET", "/rest/v1/kb_users?select=id,username,full_name,role,is_active,created_at,updated_at&order=username.asc");
  if (!result.ok) return res.status(503).json({ error: "Database pengguna belum tersedia" });
  const users = result.data;
  const q = String(req.query.q || "").toLowerCase();
  res.set("Cache-Control", "no-store").json({ users: users.filter((u) => `${u.username} ${u.full_name}`.toLowerCase().includes(q)), stats: { total: users.length, active: users.filter((u) => u.is_active).length, admins: users.filter((u) => u.is_active && u.role === "admin").length } });
});
router.all("/{:id}", async (req, res) => {
  if (!["POST", "PATCH", "DELETE"].includes(req.method)) return res.sendStatus(405);
  const create = req.method === "POST";
  if (!create && !/^[0-9a-f-]{36}$/i.test(req.params.id || "")) return res.status(400).json({ error: "ID tidak valid" });
  const body = req.body || {};
  const data = {};
  const manual = parseManualUsers(process.env.MANUAL_USERS || "");
  if (create || body.username !== undefined) {
    data.username = String(body.username || "").trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_.-]{2,63}$/.test(data.username) || manual.some((u) => u.username.toLowerCase() === data.username)) return res.status(400).json({ error: "Username tidak valid atau dicadangkan" });
  }
  if (create || body.full_name !== undefined) {
    data.full_name = String(body.full_name || "").trim();
    if (!data.full_name || data.full_name.length > 150) return res.status(400).json({ error: "Nama wajib diisi (maksimal 150 karakter)" });
  }
  if (create || body.role !== undefined) {
    data.role = body.role || "user";
    if (!["admin", "user"].includes(data.role)) return res.status(400).json({ error: "Role tidak valid" });
  }
  if (body.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") return res.sendStatus(400);
    data.is_active = body.is_active;
  }
  if (create || body.password !== undefined) {
    if (typeof body.password !== "string" || body.password.length < 12 || body.password.length > 128) return res.status(400).json({ error: "Password harus 12–128 karakter" });
    const limit = await supabaseRequest("POST", "/rest/v1/rpc/kb_action_limit", { p_key: `password:${req.session.provider}:${req.session.sub}`, p_limit: 20, p_seconds: 900 });
    if (!limit.ok || limit.data !== true) return res.status(limit.ok ? 429 : 503).json({ error: "Coba lagi nanti" });
    data.password_hash = await hashPassword(body.password);
  }
  const result = await supabaseRequest("POST", "/rest/v1/rpc/kb_mutate_user", {
    p_action: create ? "create" : req.method === "DELETE" ? "delete" : "update",
    p_id: create ? null : req.params.id,
    p_data: data,
    p_actor: req.session.provider === "database" ? req.session.sub : null,
    p_manual_admin: manual.some((u) => isCmsAdmin({ provider: "manual", r: u.role, e: u.username })),
  });
  if (!result.ok) return res.status(409).json({ error: "Perubahan ditolak: konflik username, akun sendiri, atau admin terakhir" });
  return res.status(create ? 201 : 200).json(result.data);
});
export default router;
