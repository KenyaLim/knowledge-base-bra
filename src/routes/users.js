import { Router } from "express";
import { supabaseRequest } from "../config/supabase.js";
import { requireSession } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/security.js";
import { resolveIdentity, uuidPattern } from "../utils/identity.js";

const router = Router();
const fail = (res) => res.status(400).json({ error: "Operasi tidak dapat diselesaikan. Coba lagi atau hubungi administrator." });

router.use(requireSession, (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!req.session.id || !req.session.db || req.session.r !== "admin") return res.status(403).json({ error: "Forbidden" });
  next();
});

async function recheck(req, res) {
  const identity = await resolveIdentity(req.session);
  if (identity?.db && identity.r === "admin") return true;
  res.status(403).json({ error: "Forbidden" });
  return false;
}

router.get("/", async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const search = String(req.query.search || "").trim();
  const role = String(req.query.role || "");
  const status = String(req.query.status || "");
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || search.length > 120 || !["", "user", "admin"].includes(role) || !["", "active", "inactive", "deleting"].includes(status)) return fail(res);
  const result = await supabaseRequest("POST", "/rest/v1/rpc/kb_list_users", { actor_id: req.session.id, page_number: page, page_size: limit, search_text: search, role_filter: role, status_filter: status });
  return result.ok ? res.json(result.data) : fail(res);
});

router.post("/invite", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !process.env.APP_ORIGIN) return fail(res);
  if (!await rateLimit("invite", req.session.id, 10) || !await rateLimit("invite-email", email, 3)) return fail(res);
  const audit = await supabaseRequest("POST", "/rest/v1/kb_user_audit", { actor: req.session.id, action: "invite.request" });
  if (!audit.ok) return fail(res);
  if (!await recheck(req, res)) return;
  const result = await supabaseRequest("POST", `/auth/v1/invite?redirect_to=${encodeURIComponent(process.env.APP_ORIGIN + "/password-setup.html")}`, { email });
  return result.ok ? res.json({ ok: true }) : fail(res);
});

router.use("/:id", (req, res, next) => uuidPattern.test(req.params.id) ? next() : fail(res));

router.patch("/:id", async (req, res) => {
  const { name, role, status } = req.body || {};
  if (req.params.id === req.session.id && (role !== "admin" || status !== "active")) return res.status(409).json({ error: "Tidak dapat menurunkan peran atau menonaktifkan akun sendiri." });
  if (!await recheck(req, res)) return;
  if (typeof name !== "string" || name.length > 120 || !["user", "admin"].includes(role) || !["active", "inactive"].includes(status)) return fail(res);
  const result = await supabaseRequest("POST", "/rest/v1/rpc/kb_manage_user", { actor_id: req.session.id, target_id: req.params.id, new_name: name.trim(), new_role: role, new_status: status });
  return result.ok ? res.json({ ok: true }) : fail(res);
});

router.post("/:id/email", (req, res) => res.status(409).json({ error: "Perubahan email dinonaktifkan sampai alur konfirmasi pemilik email tersedia." }));

router.post("/:id/reset", async (req, res) => {
  if (!await rateLimit("reset-admin", req.session.id) || !await rateLimit("reset-user", req.params.id, 3)) return fail(res);
  const target = await supabaseRequest("GET", `/rest/v1/kb_profiles?id=eq.${req.params.id}&select=email,status`);
  if (!target.ok || target.data?.[0]?.status !== "active") return fail(res);
  const audit = await supabaseRequest("POST", "/rest/v1/kb_user_audit", { actor: req.session.id, target: req.params.id, action: "reset.request" });
  if (!audit.ok) return fail(res);
  if (!await recheck(req, res)) return;
  const result = await supabaseRequest("POST", "/auth/v1/recover", { email: target.data[0].email });
  return result.ok ? res.json({ ok: true }) : fail(res);
});

router.delete("/:id", async (req, res) => {
  if (req.params.id === req.session.id) return res.status(409).json({ error: "Tidak dapat menghapus akun sendiri." });
  const target = await supabaseRequest("GET", `/rest/v1/kb_profiles?id=eq.${req.params.id}&select=name,role`);
  if (!target.ok || !target.data?.[0]) return fail(res);
  const user = target.data[0];
  const reserved = await supabaseRequest("POST", "/rest/v1/rpc/kb_manage_user", { actor_id: req.session.id, target_id: req.params.id, new_name: user.name, new_role: user.role, new_status: "deleting" });
  if (!reserved.ok) return fail(res);
  if (!await recheck(req, res)) return;
  const result = await supabaseRequest("DELETE", `/auth/v1/admin/users/${req.params.id}`);
  return result.ok ? res.json({ ok: true }) : fail(res);
});

export default router;
