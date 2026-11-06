import { Router } from "express";
import { requireSession } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/admin.js";
import { supabaseRequest } from "../config/supabase.js";
import { sanitizeContent } from "../utils/content.js";

const router = Router();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean = (item) => ({ ...item, answer: sanitizeContent(item.answer) });
function list(admin) {
  return async (req, res) => {
    const result = await supabaseRequest("GET", `/rest/v1/cms_faqs?select=id,question,answer,category,published,sort_order,created_at,updated_at&order=sort_order.asc,created_at.asc,id.asc${admin ? "" : "&published=eq.true"}`);
    if (!result.ok) return res.status(503).json({ error: "FAQ belum tersedia. Coba lagi nanti." });
    res.set("Cache-Control", "private, no-store").json(result.data.filter((item) => admin || item.published === true).map(clean));
  };
}
router.get("/faq", requireSession, list(false));
router.get("/admin/faq", requireSession, requireAdmin, list(true));
async function mutate(req, res) {
  const action = req.method === "POST" ? "create" : req.method === "DELETE" ? "delete" : req.method === "PATCH" ? "reorder" : "update";
  const body = req.body || {};
  const id = action === "reorder" ? body.id : req.params.id;
  if (action !== "create" && (typeof id !== "string" || !uuid.test(id))) return res.status(400).json({ error: "ID FAQ tidak valid" });
  let data = {};
  if (["create", "update"].includes(action)) {
    if (typeof body.question !== "string" || !body.question.trim() || body.question.trim().length > 300 || typeof body.answer !== "string" || body.answer.length > 50000 || !["STAGE", "PROMAN", "Umum"].includes(body.category) || typeof body.published !== "boolean") return res.status(400).json({ error: "Pertanyaan (1–300), jawaban (1–50000), kategori dan status wajib valid" });
    const answer = sanitizeContent(body.answer).trim();
    if (!answer || !answer.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() && !/<img\s[^>]*src=/.test(answer)) return res.status(400).json({ error: "Jawaban wajib diisi" });
    data = { question: body.question.trim(), answer, category: body.category, published: body.published };
  }
  if (action === "reorder") {
    if (!["up", "down"].includes(body.direction)) return res.status(400).json({ error: "Arah tidak valid" });
    data.direction = body.direction;
  }
  const result = await supabaseRequest("POST", "/rest/v1/rpc/cms_mutate_faq", { p_action: action, p_id: id || null, p_data: data });
  if (!result.ok) return res.status(503).json({ error: "Gagal menyimpan FAQ. Coba lagi nanti." });
  if (!result.data) return res.status(404).json({ error: "FAQ tidak ditemukan" });
  return res.status(action === "create" ? 201 : 200).json(clean(result.data));
}
router.patch("/admin/faq/reorder", requireSession, requireAdmin, mutate);
router.post("/admin/faq", requireSession, requireAdmin, mutate);
router.put("/admin/faq/:id", requireSession, requireAdmin, mutate);
router.delete("/admin/faq/:id", requireSession, requireAdmin, mutate);
export default router;
