import {
  deleteMaterial,
  deleteAllNavigation,
  deleteNavigation,
  listMaterials,
  listNavigation,
  getNavigationPage,
  normalizePayload,
  upsertMaterial,
  upsertNavigation,
} from "../models/cmsModel.js";
import { parsePaging } from "../utils/session.js";
import { storageBucket, supabaseBaseUrl } from "../config/supabase.js";
import { newId } from "../utils/session.js";

function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}

function defaultNavKey(item) {
  return String(item.nav_key || (item.page ? `${item.scope}:${item.page}` : `${item.scope}:category:${slugify(item.title)}`)).toLowerCase();
}

export async function getNavigation(req, res) {
  const result = await listNavigation({ publishedOnly: true });
  if (!result.ok) return res.status(502).json({ error: "Could not load navigation" });
  return res.json({ items: result.data });
}

export async function getAdminNavigation(req, res) {
  const result = await listNavigation({ publishedOnly: false });
  if (!result.ok) return res.status(502).json({ error: "Could not load navigation" });
  return res.json({ items: result.data });
}

export async function getDynamicPage(req, res) {
  const result = await getNavigationPage(req.params.page, { publishedOnly: true });
  const page = Array.isArray(result.data) ? result.data[0] : null;
  if (!result.ok) return res.status(502).json({ error: "Could not load page" });
  if (!page) return res.status(404).send("Page not found");
  const materialResults = await Promise.all([
    listMaterials({ slug: page.page, publishedOnly: true }),
    listMaterials({ slug: `erp-${page.page}`, publishedOnly: true }),
  ]);
  const material = materialResults.map((result) => result.ok ? result.data : null).find(Boolean);
  const title = material?.title || page.title;
  const h1 = material?.title || page.h1 || page.title;
  const summary = material?.summary || page.summary || "";
  const content = material?.content || page.content || "<p>Belum ada konten.</p>";
  const escape = (value) => String(value || "").replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" }[character]));
  return res.send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><link rel="stylesheet" href="/css/style.css"><script src="https://unpkg.com/@phosphor-icons/web"></script></head><body data-page="${escape(page.page)}" data-cms-slug="${escape(page.page)}"><div id="navbar"></div><div class="app-layout"><aside id="sidebar"></aside><main class="main-content"><section class="hero"><div class="hero-content"><p class="eyebrow">${escape(page.scope)}</p><h1>${escape(h1)}</h1><p class="hero-description">${escape(summary)}</p></div></section><section class="section"><article class="doc-block">${content}</article></section></main></div><script src="/js/navbar.js"></script></body></html>`);
}

export async function saveAdminNavigation(req, res) {
  const item = req.body || {};
  const scope = String(item.scope || "").toLowerCase();
  const parentId = item.parent_id || null;
  if (!["stage", "proman"].includes(scope)) {
    return res.status(400).json({ error: "Choose STAGE or PROMAN" });
  }
  if (!item.title || (!!item.page !== !!item.url) || (item.page && !parentId)) {
    return res.status(400).json({ error: "Title is required; page and URL must be provided together" });
  }
  const existing = await listNavigation({ publishedOnly: false });
  if (!existing.ok) return res.status(502).json({ error: "Could not validate navigation hierarchy" });
  const parent = parentId ? existing.data.find((entry) => entry.id === parentId) : null;
  if (parentId && !parent) return res.status(400).json({ error: "Parent navigation was not found" });
  if (parent && (parent.scope !== scope || parent.page || parent.url)) {
    return res.status(400).json({ error: "Parent must be a category in the same area" });
  }
  const payload = {
    id: item.id || newId(),
    parent_id: parentId,
    scope,
    title: String(item.title).trim(),
    icon: String(item.icon || "ph-link").trim(),
    page: item.page ? String(item.page).trim() : null,
    url: item.url ? String(item.url).trim() : null,
    h1: String(item.h1 || item.title || "").trim(),
    summary: String(item.summary || "").trim(),
    content: String(item.content || ""),
    nav_key: defaultNavKey({ ...item, scope, title: String(item.title).trim() }),
    node_type: item.page ? "page" : "category",
    route_type: item.route_type || (item.page && String(item.url || "").startsWith("/api/cms/page/") ? "dynamic" : "static"),
    template_key: String(item.template_key || "documentation"),
    source_path: item.source_path ? String(item.source_path).trim() : null,
    sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : 0,
    published: Boolean(item.published),
  };
  const result = await upsertNavigation(payload);
  if (!result.ok) return res.status(502).json({ error: "Could not save navigation", details: result.error });
  return res.json({ item: Array.isArray(result.data) ? result.data[0] : result.data });
}

export async function importAdminNavigation(req, res) {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: "Navigation items are required" });
  const keyToId = new Map();
  const keys = new Set();
  const existing = await listNavigation({ publishedOnly: false });
  if (!existing.ok) return res.status(502).json({ error: "Could not load existing navigation" });
  const existingByKey = new Map(existing.data.map((item) => [item.nav_key, item]));
  for (const item of items) {
    if (!item.key || keys.has(item.key)) return res.status(400).json({ error: "Imported navigation contains duplicate or missing keys" });
    keys.add(item.key);
    keyToId.set(item.key, existingByKey.get(defaultNavKey(item))?.id || newId());
  }
  const payload = items.map(function (item) {
    const parentId = item.parent_key ? keyToId.get(item.parent_key) : null;
    const page = item.page ? String(item.page).trim() : null;
    const old = existingByKey.get(defaultNavKey(item));
    const url = old?.url || (page ? `/api/cms/page/${page}` : null);
    return {
      id: keyToId.get(item.key),
      parent_id: parentId || null,
      nav_key: defaultNavKey({ ...item, scope: item.scope === "proman" ? "proman" : "stage" }),
      node_type: page ? "page" : "category",
      route_type: page ? "dynamic" : "static",
      template_key: "documentation",
      source_path: item.url || null,
      scope: item.scope === "proman" ? "proman" : "stage",
      title: String(item.title || "").trim(),
      icon: old?.icon || String(item.icon || "ph-link").trim(),
      page,
      url,
      h1: old?.h1 || String(item.title || "").trim(),
      summary: old?.summary || "",
      content: old?.content || "",
      sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : 0,
      published: old ? old.published : true,
    };
  });
  if (payload.some((item) => !item.title || (!!item.page !== !!item.url))) {
    return res.status(400).json({ error: "Imported navigation contains invalid parent or child data" });
  }
  if (items.some((item) => item.parent_key && !keys.has(item.parent_key))) {
    return res.status(400).json({ error: "Imported navigation contains a missing parent" });
  }
  const result = await upsertNavigation(payload);
  if (!result.ok) return res.status(502).json({ error: "Could not import navigation", details: result.error });
  return res.json({ items: result.data || payload });
}

export async function removeAdminNavigation(req, res) {
  const id = String(req.query.id || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return res.status(400).json({ error: "A valid navigation id is required" });
  }
  const result = await deleteNavigation(id);
  if (!result.ok) return res.status(502).json({ error: "Could not delete navigation" });
  return res.json({ deleted: true });
}

export async function getContent(req, res) {
  const { page, limit, module, slug, usePaging } = parsePaging(req.query);
  if (slug && !usePaging) {
    const result = await listMaterials({ slug, publishedOnly: true });
    if (!result.ok) return res.status(502).json({ error: "CMS database request failed" });
    return res.json(result.data);
  }
  const result = await listMaterials({ module, page, limit, publishedOnly: true, slug: usePaging ? slug : "" });
  if (!result.ok) return res.status(502).json({ error: "CMS database request failed" });
  if (result.single) return res.json(result.data);
  if (!usePaging) return res.json(result.data);
  return res.json({ data: result.data, meta: result.meta });
}

export async function getAdminContent(req, res) {
  const { page, limit, module, slug, usePaging } = parsePaging(req.query);
  if (slug && !usePaging) {
    const result = await listMaterials({ slug, publishedOnly: false });
    if (!result.ok) return res.status(502).json({ error: "CMS database request failed" });
    return res.json(result.data);
  }
  const result = await listMaterials({ module, page, limit, publishedOnly: false, slug: usePaging ? slug : "" });
  if (!result.ok) return res.status(502).json({ error: "CMS database request failed" });
  if (result.single) return res.json(result.data);
  if (!usePaging) return res.json(result.data);
  return res.json({ data: result.data, meta: result.meta });
}

export async function saveAdminContent(req, res) {
  const material = req.body || {};
  if (!["string", "object"].includes(typeof material)) return res.status(400).json({ error: "Invalid JSON" });
  if (!(typeof material.slug === "string" && material.slug.trim()) || !(typeof material.title === "string" && material.title.trim())) {
    return res.status(400).json({ error: "Slug and title are required" });
  }
  const editedBy = req.session?.n || req.session?.e || req.session?.u || "";
  const payload = normalizePayload(material, editedBy);
  const result = await upsertMaterial(payload);
  if (!result.ok) {
    return res.status(502).json({ error: "Could not save CMS material", details: result.error || "Supabase request failed" });
  }
  const saved = result.data?.[0] || payload;
  if (result.metadata_warning) return res.json({ ...saved, metadata_warning: result.metadata_warning });
  return res.json(saved);
}

export async function removeAdminContent(req, res) {
  const id = req.query.id;
  const slug = req.query.slug;
  if (!id && !slug) return res.status(400).json({ error: "A material id or slug is required" });
  if (id && !/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: "A valid material id is required" });
  const result = await deleteMaterial({ id, slug });
  if (!result.ok) return res.status(502).json({ error: "Could not delete CMS material" });
  return res.json({ deleted: true });
}

const ALLOWED_TYPES = /^application\/pdf$|^image\/(png|jpeg|jpg|webp|gif)$/;

export async function uploadAdminFile(req, res) {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "A file is required" });
  if (file.size > 15 * 1024 * 1024) return res.status(400).json({ error: "File size must be 15 MB or less" });
  if (!ALLOWED_TYPES.test(file.mimetype)) return res.status(400).json({ error: "Only PDF and image files are supported" });
  const baseUrl = supabaseBaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!baseUrl || !serviceKey) return res.status(502).json({ error: "Storage is not configured" });
  const bucket = storageBucket();
  const ext = file.originalname.includes(".") ? file.originalname.split(".").pop().toLowerCase() : "bin";
  const path = `${newId()}.${ext}`;
  try {
    const response = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": file.mimetype,
        "x-upsert": "true",
      },
      body: file.buffer,
    });
    if (!response.ok) return res.status(502).json({ error: "Could not upload file" });
    return res.json({ url: `${baseUrl}/storage/v1/object/public/${bucket}/${path}` });
  } catch {
    return res.status(502).json({ error: "Could not upload file" });
  }
}
