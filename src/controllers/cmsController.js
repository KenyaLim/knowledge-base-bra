import { deleteMaterial, listMaterials, listNavigation, getNavigationPage, normalizePayload, upsertMaterial, upsertNavigation } from "../models/cmsModel.js";
import { parsePaging, newId } from "../utils/session.js";
import { storageBucket, supabaseBaseUrl, supabaseRequest } from "../config/supabase.js";
import { renderDocumentationPage } from "../templates/documentationPage.js";
import { sanitizeContent, sanitizeMaterial } from "../utils/content.js";

export async function getDynamicPage(req, res) {
  const result = await getNavigationPage(req.params.page, { publishedOnly: true });
  if (!result.ok) return res.status(502).json({ error: "Could not load page" });
  const page = result.data?.[0];
  if (!page) return res.status(404).send("Page not found");
  const results = await Promise.all([listMaterials({ slug: page.page }), listMaterials({ slug: `erp-${page.page}` })]);
  const material = results.map((entry) => entry.ok ? entry.data : null).find(Boolean);
  res.set("Cache-Control", "private, no-store");
  return res.send(renderDocumentationPage({ page, material }));
}

export async function getNavigation(req, res) {
  const result = await listNavigation({ publishedOnly: true });
  return result.ok ? res.json({ items: result.data }) : res.status(502).json({ error: "Could not load navigation" });
}

export async function getAdminNavigation(req, res) {
  const result = await listNavigation({ publishedOnly: false });
  return result.ok ? res.json({ items: result.data }) : res.status(502).json({ error: "Could not load navigation" });
}

export async function saveAdminNavigation(req, res) {
  const item = req.body || {};
  if (!["module", "page"].includes(item.type) || !["stage", "proman"].includes(item.scope) || typeof item.title !== "string" || !item.title.trim()) return res.status(400).json({ error: "Type, area and title are required" });
  const result = await supabaseRequest("POST", "/rest/v1/rpc/cms_navigation_save", {
    p_item: { type: item.type, scope: item.scope, title: item.title.trim(), parent_id: item.parent_id || null, ...(item.id ? { id: item.id } : {}) },
    p_editor: req.session?.n || req.session?.e || req.session?.u || "",
  });
  return result.ok ? res.json({ item: result.data }) : res.status(400).json({ error: result.error || "Apply the navigation migration before saving" });
}

export async function moveAdminNavigation(req, res) {
  if (![-1, 1].includes(req.body?.direction)) return res.status(400).json({ error: "Invalid direction" });
  const result = await supabaseRequest("POST", "/rest/v1/rpc/cms_navigation_move", { p_id: req.body.id, p_direction: req.body.direction });
  return result.ok ? res.json(result.data) : res.status(400).json({ error: result.error });
}

export async function removeAdminNavigation(req, res) {
  const result = await supabaseRequest("POST", "/rest/v1/rpc/cms_navigation_remove", { p_id: req.query.id });
  return result.ok ? res.json(result.data) : res.status(400).json({ error: result.error });
}

export async function importAdminNavigation(req, res) {
  const items = req.body?.items;
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Navigation items are required" });
  const existing = await listNavigation({ publishedOnly: false });
  if (!existing.ok) return res.status(502).json({ error: "Could not load navigation" });
  const keys = new Map();
  const additions = [];
  for (const item of items) {
    if (!item.key || keys.has(item.key) || !["stage", "proman"].includes(item.scope) || !String(item.title || "").trim()) return res.status(400).json({ error: "Invalid import" });
    const parentId = item.parent_key ? keys.get(item.parent_key) : null;
    if (item.parent_key && !parentId) return res.status(400).json({ error: "Parents must precede children" });
    const parent = parentId ? existing.data.concat(additions).find((entry) => entry.id === parentId) : null;
    if (parentId && (!parent || parent.scope !== item.scope || parent.page)) return res.status(400).json({ error: "Invalid import parent" });
    const match = existing.data.find((entry) => entry.scope === item.scope && (item.page ? entry.page === item.page : !entry.page && entry.title === item.title && entry.parent_id === parentId));
    const id = match?.id || newId();
    keys.set(item.key, id);
    if (match) continue;
    const page = item.page ? String(item.page) : null;
    const url = page ? String(item.url || "") : null;
    if (page && (!parentId || !url || /^(?:[a-z]+:|\/\/)/i.test(url))) return res.status(400).json({ error: "Invalid imported page URL" });
    additions.push({ id, parent_id: parentId, scope: item.scope, title: String(item.title).trim(), icon: item.icon || (page ? "ph-file-text" : "ph-folder"), page, url, published: true, sort_order: Number(item.sort_order) || 0 });
  }
  if (!additions.length) return res.json({ items: existing.data });
  const result = await upsertNavigation(additions);
  return result.ok ? res.json({ items: existing.data.concat(result.data || additions) }) : res.status(502).json({ error: "Could not import navigation" });
}

async function contentResponse(req, res, publishedOnly) {
  const { page, limit, module, slug, usePaging } = parsePaging(req.query);
  const result = await listMaterials({ module, page, limit, publishedOnly, slug });
  if (!result.ok) return res.status(502).json({ error: "CMS database request failed" });
  const data = sanitizeMaterial(result.data);
  return res.json(result.single || !usePaging ? data : { data, meta: result.meta });
}

export async function getContent(req, res) { return contentResponse(req, res, true); }
export async function getAdminContent(req, res) { return contentResponse(req, res, false); }

export async function saveAdminContent(req, res) {
  const material = req.body || {};
  if (typeof material.slug !== "string" || !material.slug.trim() || typeof material.title !== "string" || !material.title.trim()) return res.status(400).json({ error: "Slug and title are required" });
  const payload = normalizePayload({ ...material, content: sanitizeContent(material.content) }, req.session?.n || req.session?.e || req.session?.u || "");
  const result = await upsertMaterial(payload);
  if (!result.ok) return res.status(502).json({ error: "Could not save CMS material" });
  return res.json({ ...sanitizeMaterial(result.data?.[0] || payload), ...(result.metadata_warning ? { metadata_warning: result.metadata_warning } : {}) });
}

export async function removeAdminContent(req, res) {
  const { id, slug } = req.query;
  if (!id && !slug) return res.status(400).json({ error: "A material id or slug is required" });
  const result = await deleteMaterial({ id, slug });
  return result.ok ? res.json({ deleted: true }) : res.status(502).json({ error: "Could not delete CMS material" });
}

export async function uploadAdminFile(req, res) {
  const file = req.file;
  const extensions = { "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
  if (!file || !extensions[file.mimetype] || file.size > 15 * 1024 * 1024) return res.status(400).json({ error: "Choose a PDF or image up to 15 MB" });
  const baseUrl = supabaseBaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!baseUrl || !serviceKey) return res.status(502).json({ error: "Storage is not configured" });
  const path = `${newId()}.${extensions[file.mimetype]}`;
  try {
    const response = await fetch(`${baseUrl}/storage/v1/object/${storageBucket()}/${path}`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": file.mimetype, "x-upsert": "false" },
      body: file.buffer,
    });
    if (!response.ok) throw new Error("Upload failed");
    return res.json({ url: `${baseUrl}/storage/v1/object/public/${storageBucket()}/${path}` });
  } catch {
    return res.status(502).json({ error: "Could not upload file" });
  }
}
