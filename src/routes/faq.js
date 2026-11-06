import { Router } from "express";
import { requireSession } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/admin.js";
import { supabaseRequest } from "../config/supabase.js";
import { sanitizeContent } from "../utils/content.js";

const router = Router();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clean = (item) => ({ ...item, ...(typeof item.answer === "string" ? { answer: sanitizeContent(item.answer) } : {}) });
function list(admin) {
  return async (req, res) => {
    if (Object.keys(req.query).some((key) => !["search", "category", "tag", "featured", "limit", "offset", "page"].includes(key))) return res.status(400).json({ error: "Filter FAQ tidak valid" });
    const { search = "", category = "Semua", tag = "", featured, limit = "20", offset = "0", page } = req.query;
    if ([search, category, tag, limit, offset].some((v) => typeof v !== "string") || search.length > 300 || tag.length > 40 || !["Semua", "STAGE", "PROMAN", "Umum"].includes(category) || !/^\d+$/.test(limit) || +limit < 1 || +limit > 50 || !/^\d+$/.test(offset) || +offset > 100000 || (page !== undefined && (typeof page !== "string" || !/^[1-9]\d*$/.test(page) || +page > 2000)) || (featured !== undefined && !["true", "false"].includes(featured))) return res.status(400).json({ error: "Filter FAQ tidak valid" });
    const query = new URLSearchParams({ select: "id,question,category,published,sort_order,created_at,updated_at,tags,featured", order: "sort_order.asc,created_at.asc,id.asc", limit, offset: String(page ? (+page - 1) * +limit : +offset) });
    if (!admin) query.set("published", "eq.true");
    if (category !== "Semua") query.set("category", `eq.${category}`);
    if (featured !== undefined) query.set("featured", `eq.${featured}`);
    if (tag) query.set("tags", `cs.${JSON.stringify([tag]) .replace(/^\[/, "{").replace(/\]$/, "}")}`);
    if (search.trim()) query.set("question", `imatch.${search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
    const result = await supabaseRequest("GET", `/rest/v1/cms_faqs?${query}`);
    if (!result.ok) return res.status(503).json({ error: "FAQ belum tersedia. Coba lagi nanti." });
    res.set("Cache-Control", "private, no-store").json(result.data.filter((item) => admin || item.published === true).map(clean));
  };
}
router.get("/faq", requireSession, list(false));
router.get("/admin/faq", requireSession, requireAdmin, list(true));
function detail(admin) {
  return async (req, res) => {
    if (!uuid.test(req.params.id)) return res.status(400).json({ error: "ID FAQ tidak valid" });
    const result = await supabaseRequest("GET", `/rest/v1/cms_faqs?select=*&id=eq.${req.params.id}&limit=1${admin ? "" : "&published=eq.true"}`);
    res.set("Cache-Control", "private, no-store");
    if (!result.ok) return res.status(503).json({ error: "FAQ belum tersedia" });
    const item = result.data.find((row) => row.id === req.params.id && (admin || row.published === true));
    return item ? res.json(clean(item)) : res.status(404).json({ error: "FAQ tidak ditemukan" });
  };
}
function suggestions(admin) {
  return async (req, res) => {
    const search = req.query.search || "";
    if (typeof search !== "string" || search.length > 40) return res.status(400).json({ error: "Tag tidak valid" });
    const result = await supabaseRequest("POST", "/rest/v1/rpc/cms_faq_tags", { p_search: search, p_admin: admin });
    res.set("Cache-Control", "private, no-store");
    return result.ok ? res.json(result.data.map((row) => row.tag)) : res.status(503).json({ error: "Tag belum tersedia" });
  };
}
router.get("/faq/tags", requireSession, suggestions(false));
router.get("/admin/faq/tags", requireSession, requireAdmin, suggestions(true));
router.get("/faq/:id", requireSession, detail(false));
router.get("/admin/faq/:id", requireSession, requireAdmin, detail(true));
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
    if (body.featured !== undefined) {
      if (typeof body.featured !== "boolean") return res.status(400).json({ error: "Featured tidak valid" });
      data.featured = body.featured;
    }
    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags) || body.tags.length > 20 || body.tags.some((tag) => typeof tag !== "string" || !tag.trim() || tag.trim().length > 40 || /[\x00-\x1f]/.test(tag))) return res.status(400).json({ error: "Tag tidak valid" });
      data.tags = [...new Set(body.tags.map((tag) => tag.trim()))];
    }
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
