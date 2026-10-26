import {
  deleteMaterial,
  deleteAllNavigation,
  deleteNavigation,
  listMaterials,
  listNavigation,
  normalizePayload,
  upsertMaterial,
  upsertNavigation,
} from "../models/cmsModel.js";
import { parsePaging } from "../utils/session.js";
import { storageBucket, supabaseBaseUrl } from "../config/supabase.js";
import { newId } from "../utils/session.js";

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
  if (!item.title || (!!item.page !== !!item.url) || (item.page && !parentId)) {
    return res.status(400).json({ error: "Title is required; page and URL must be provided together" });
  }
  const payload = {
    id: item.id || newId(),
    parent_id: parentId,
    scope,
    title: String(item.title).trim(),
    icon: item.icon === undefined ? "ph-link" : String(item.icon).trim(),
    page: item.page ? String(item.page).trim() : null,
    url: item.url ? String(item.url).trim() : null,
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
  const payload = items.map(function (item) {
    const id = newId();
    keyToId.set(item.key, id);
    return {
      id,
      parent_id: item.parent_key ? keyToId.get(item.parent_key) || null : null,
      scope: item.scope === "proman" ? "proman" : "stage",
      title: String(item.title || "").trim(),
      icon: String(item.icon || (item.page ? "ph-file-text" : "ph-folder")).trim(),
      page: item.page ? String(item.page).trim() : null,
      url: item.url ? String(item.url).trim() : null,
      sort_order: Number.isFinite(Number(item.sort_order)) ? Number(item.sort_order) : 0,
      published: true,
    };
  });
  if (payload.some((item) => !item.title || (!!item.page !== !!item.url))) {
    return res.status(400).json({ error: "Imported navigation contains invalid parent or child data" });
  }
  const cleared = await deleteAllNavigation();
  if (!cleared.ok) return res.status(502).json({ error: "Could not replace existing navigation", details: cleared.error });
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
