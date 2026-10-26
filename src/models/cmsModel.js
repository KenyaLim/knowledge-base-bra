import { supabaseRequest } from "../config/supabase.js";

const ORDER = "order=sort_order.asc,created_at.asc";
const NAVIGATION_ORDER = "order=sort_order.asc,title.asc";

export async function listNavigation({ publishedOnly = true } = {}) {
  const published = publishedOnly ? "&published=eq.true" : "";
  const result = await supabaseRequest("GET", `/rest/v1/cms_navigation?select=*&${NAVIGATION_ORDER}${published}`);
  if (!result.ok) return result;
  return { ...result, data: Array.isArray(result.data) ? result.data : [] };
}

export async function upsertNavigation(payload) {
  return supabaseRequest("POST", "/rest/v1/cms_navigation?on_conflict=nav_key", payload, {
    Prefer: "resolution=merge-duplicates,return=representation",
  });
}

export async function getNavigationPage(page, { publishedOnly = true } = {}) {
  const published = publishedOnly ? "&published=eq.true" : "";
  return supabaseRequest("GET", `/rest/v1/cms_navigation?select=*&page=eq.${encodeURIComponent(page)}${published}&limit=1`);
}

export async function deleteNavigation(id) {
  return supabaseRequest("DELETE", `/rest/v1/cms_navigation?id=eq.${encodeURIComponent(id)}`);
}

export async function deleteAllNavigation() {
  return supabaseRequest("DELETE", "/rest/v1/cms_navigation?id=not.is.null");
}

function moduleFilter(module) {
  if (!module) return "";
  const m = encodeURIComponent(module);
  return `&or=(module.ilike.*${m}*,module_id.eq.${m})`;
}

export async function listMaterials({ module = "", page = 1, limit = 9, publishedOnly = true, slug = "" }) {
  if (slug) {
    const filter = publishedOnly ? "&published=eq.true" : "";
    const result = await supabaseRequest("GET", `/rest/v1/cms_materials?select=*&slug=eq.${encodeURIComponent(slug)}${filter}&limit=1`);
    return { single: true, ok: result.ok, data: result.data?.[0] || null, error: result.error };
  }
  const offset = (page - 1) * limit;
  const published = publishedOnly ? "&published=eq.true" : "";
  const query = `/rest/v1/cms_materials?select=*${published}${moduleFilter(module)}&${ORDER}&limit=${limit}&offset=${offset}`;
  const result = await supabaseRequest("GET", query, undefined, { Prefer: "count=exact" });
  if (!result.ok) return { single: false, ok: false, data: [], error: result.error, meta: { total: 0, page, limit, totalPages: 1, module: module || null } };
  const total = typeof result.total === "number" ? result.total : (Array.isArray(result.data) ? result.data.length : 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  return {
    single: false,
    ok: true,
    data: result.data || [],
    error: null,
    meta: { total, page: safePage, limit, totalPages, module: module || null },
  };
}

export async function upsertMaterial(payload) {
  const result = await supabaseRequest("POST", "/rest/v1/cms_materials?on_conflict=slug", payload, {
    Prefer: "resolution=merge-duplicates,return=representation",
  });
  if (result.ok) return result;
  const legacy = { ...payload };
  delete legacy.last_edited_at;
  delete legacy.last_edited_by;
  const retry = await supabaseRequest("POST", "/rest/v1/cms_materials?on_conflict=slug", legacy, {
    Prefer: "resolution=merge-duplicates,return=representation",
  });
  if (retry.ok) {
    return {
      ...retry,
      metadata_warning: "Jalankan migration sql/cms.sql di Supabase agar tanggal dan user editor tersimpan.",
    };
  }
  return { ok: false, error: retry.error || result.error || "Supabase request failed" };
}

export async function deleteMaterial({ id, slug }) {
  const filter = id ? `id=eq.${encodeURIComponent(id)}` : `slug=eq.${encodeURIComponent(slug)}`;
  return supabaseRequest("DELETE", `/rest/v1/cms_materials?${filter}`);
}

export function normalizePayload(material, editedBy) {
  return {
    slug: String(material.slug).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    title: String(material.title).trim(),
    module: String(material.module || "").trim(),
    module_id: String(material.module_id || material.module || "").trim().toLowerCase(),
    kind: material.kind === "overview" ? "overview" : "detail",
    summary: String(material.summary || "").trim(),
    content: String(material.content || ""),
    pdf_url: String(material.pdf_url || "").trim(),
    image_url: material.kind === "overview" ? "" : String(material.image_url || "").trim(),
    published: Boolean(material.published),
    sort_order: Number.isFinite(Number(material.sort_order)) ? Number(material.sort_order) : 0,
    last_edited_at: new Date().toISOString(),
    last_edited_by: String(editedBy || "").trim(),
  };
}
