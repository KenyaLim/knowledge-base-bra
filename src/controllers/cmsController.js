import { deleteMaterial, listMaterials, normalizePayload, upsertMaterial } from "../models/cmsModel.js";
import { parsePaging } from "../utils/session.js";
import { storageBucket, supabaseBaseUrl } from "../config/supabase.js";
import { newId } from "../utils/session.js";

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
