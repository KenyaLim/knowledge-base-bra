import {
  deleteMaterial,
  deleteNavigation,
  listMaterials,
  listNavigation,
  listNavigationChildren,
  getNavigationPage,
  normalizePayload,
  upsertMaterial,
  upsertNavigation,
} from "../models/cmsModel.js";
import { parsePaging } from "../utils/session.js";
import { storageBucket, supabaseBaseUrl } from "../config/supabase.js";
import { newId } from "../utils/session.js";
import { renderDocumentationPage } from "../templates/documentationPage.js";

export async function getDynamicPage(req, res) {
  const result = await getNavigationPage(req.params.page, { publishedOnly: true });
  if (!result.ok) return res.status(502).json({ error: "Could not load page" });
  const page = Array.isArray(result.data) ? result.data[0] : null;
  if (!page) return res.status(404).send("Page not found");
  const materialResults = await Promise.all([
    listMaterials({ slug: page.page, publishedOnly: true }),
    listMaterials({ slug: `erp-${page.page}`, publishedOnly: true }),
  ]);
  const material = materialResults.map((result) => result.ok ? result.data : null).find(Boolean);
  return res.send(renderDocumentationPage({ page, material }));
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

export async function saveAdminNavigation(req, res) {
  const item = req.body || {};
  const scope = String(item.scope || "").toLowerCase();
  const parentId = item.parent_id || null;
  if (!["stage", "proman"].includes(scope)) {
    return res.status(400).json({ error: "Choose STAGE or PROMAN" });
  }
  if (!item.title || (item.page && !parentId)) {
    return res.status(400).json({ error: "Title is required and a page must have a parent" });
  }
  const existingResult = await listNavigation({ publishedOnly: false });
  if (!existingResult.ok) return res.status(502).json({ error: "Could not validate navigation hierarchy" });
  const existingItems = existingResult.data || [];
  const existingItem = item.id ? existingItems.find((entry) => entry.id === item.id) : null;
  const parent = parentId ? existingItems.find((entry) => entry.id === parentId) : null;
  if (parentId && !parent) return res.status(400).json({ error: "Parent navigation was not found" });
  if (parent && (parent.scope !== scope || parent.page || parent.url)) {
    return res.status(400).json({ error: "Parent must be a category in the same area" });
  }
  if (existingItem && existingItem.id === parentId) {
    return res.status(400).json({ error: "An item cannot be its own parent" });
  }
  let ancestor = parent;
  while (ancestor) {
    if (ancestor.id === existingItem?.id) return res.status(400).json({ error: "Navigation hierarchy cannot contain a cycle" });
    ancestor = existingItems.find((entry) => entry.id === ancestor.parent_id);
  }
  const page = item.page ? String(item.page).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") : null;
  const duplicate = page && existingItems.find((entry) => entry.id !== existingItem?.id && entry.scope === scope && entry.page === page);
  if (duplicate) return res.status(409).json({ error: "Page key must be unique within its scope" });
  const payload = {
    id: item.id || newId(),
    parent_id: parentId,
    scope,
    title: String(item.title).trim(),
    icon: item.icon === undefined ? (existingItem?.icon || "ph-link") : String(item.icon).trim(),
    page,
    url: page ? (String(item.url || existingItem?.url || `/api/cms/page/${page}`).trim()) : null,
    h1: item.h1 === undefined ? (existingItem?.h1 || String(item.title).trim()) : String(item.h1).trim(),
    summary: item.summary === undefined ? (existingItem?.summary || "") : String(item.summary).trim(),
    content: item.content === undefined ? (existingItem?.content || "") : String(item.content),
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
  const existingResult = await listNavigation({ publishedOnly: false });
  if (!existingResult.ok) return res.status(502).json({ error: "Could not load existing navigation" });
  const existing = existingResult.data || [];
  const byKey = new Map(existing.map((item) => [item.page || item.title.toLowerCase(), item]));
  const keyToId = new Map();
  items.forEach((item) => {
    const match = item.id && existing.find((entry) => entry.id === item.id) || byKey.get(item.key) || byKey.get(String(item.title || "").trim().toLowerCase());
    keyToId.set(item.key, match?.id || item.id || newId());
  });
  const payload = items.map((item) => {
    const id = keyToId.get(item.key);
    const previous = existing.find((entry) => entry.id === id);
    const page = item.page ? String(item.page).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") : null;
    return {
      id,
      parent_id: item.parent_key ? keyToId.get(item.parent_key) || null : null,
      scope: item.scope === "proman" ? "proman" : "stage",
      title: String(item.title || previous?.title || "").trim(),
      icon: String(item.icon || previous?.icon || (page ? "ph-file-text" : "ph-folder")).trim(),
      page,
      url: page ? String(item.url || previous?.url || `/api/cms/page/${page}`).trim() : null,
      sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : (previous?.sort_order || 0),
      published: item.published === undefined ? (previous?.published ?? true) : Boolean(item.published),
    };
  });
  if (payload.some((item) => !item.title || (!!item.page !== !!item.url) || (item.parent_id === item.id))) return res.status(400).json({ error: "Imported navigation contains invalid data" });
  const result = await upsertNavigation(payload);
  if (!result.ok) return res.status(502).json({ error: "Could not import navigation", details: result.error });
  return res.json({ items: result.data || payload });
}

export async function removeAdminNavigation(req, res) {
  const id = String(req.query.id || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return res.status(400).json({ error: "A valid navigation id is required" });
  }
  const children = await listNavigationChildren(id);
  if (!children.ok) return res.status(502).json({ error: "Could not validate navigation children" });
  if (children.data?.length) return res.status(409).json({ error: "Cannot delete a module that still has child pages" });
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
