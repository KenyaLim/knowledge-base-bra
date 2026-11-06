import { supabaseRequest } from "../config/supabase.js";
import aliases from "../../generated/navigation-aliases.json" with { type: "json" };

export async function pageAccess(path, admin = false) {
  if (admin) return { ok: true, allowed: true };
  const key = navigationPath(path);
  const alias = aliases[key];
  const dynamic = key?.startsWith("/docs/") ? key.slice(6) : null;
  if (!dynamic && !/^\/(?:erp|stage|proman)\//.test(key || "")) return { ok: true, allowed: true };
  const result = await listNavigation({ publishedOnly: false });
  if (!result.ok) return { ok: false, allowed: false };
  const { visible } = navigationVisibility(result.data);
  const matches = result.data.filter((item) => item.page && (navigationPath(item.url) === key || item.page === alias?.page || item.page === dynamic));
  if (matches.some((item) => !visible(item))) return { ok: true, allowed: false };
  const slugs = new Set(matches.flatMap((item) => [item.page, `erp-${item.page}`]));
  if (alias) slugs.add(alias.slug);
  for (const slug of slugs) {
    const material = await listMaterials({ slug, publishedOnly: false });
    if (!material.ok) return { ok: false, allowed: false };
    if (material.data && !navigationVisibility(result.data).materialVisible(material.data)) return { ok: true, allowed: false };
  }
  return { ok: true, allowed: !dynamic || matches.length > 0 };
}

const ORDER = "order=sort_order.asc,created_at.asc";
const NAVIGATION_ORDER = "order=sort_order.asc,title.asc";

export function navigationVisibility(items) {
  const byId = new Map(items.map((item) => [item.id, item]));
  function visible(item, visited = new Set()) {
    if (!item || item.published === false || visited.has(item)) return false;
    if (!item.parent_id) return true;
    visited.add(item);
    const parent = byId.get(item.parent_id);
    return parent?.scope === item.scope && visible(parent, visited);
  }
  function materialVisible(material) {
    const matches = items.filter((item) => item.page && [item.page, `erp-${item.page}`].includes(material.slug));
    const modules = items.filter((item) => !item.page && item.id === material.module_id);
    return material.published !== false && matches.concat(modules).every((item) => visible(item));
  }
  return { visible, materialVisible };
}

export function navigationPath(value) {
  try {
    if (!value || /^(?:[a-z]+:|\/\/)/i.test(value) || value.includes("\\")) return null;
    return decodeURIComponent(new URL(value.startsWith("/") ? value : `/${value}`, "https://navigation.invalid").pathname).replace(/\.html$/, "").replace(/\/$/, "");
  } catch { return null; }
}

export async function getNavigationPage(page, { publishedOnly = true } = {}) {
  const result = await listNavigation({ publishedOnly });
  return { ...result, data: result.data?.filter((item) => item.page === page).slice(0, 1) };
}

export async function listNavigation({ publishedOnly = true } = {}) {
  const published = arguments[0]?.publishedOnly ? "&published=eq.true" : "";
  const result = await supabaseRequest("GET", `/rest/v1/cms_navigation?select=*&${NAVIGATION_ORDER}${published}`);
  if (!result.ok) return result;
  const items = Array.isArray(result.data) ? result.data : [];
  const { visible } = navigationVisibility(items);
  return { ...result, data: publishedOnly ? items.filter((item) => visible(item)) : items };
}

export async function upsertNavigation(payload) {
  return supabaseRequest("POST", "/rest/v1/cms_navigation?on_conflict=id", payload, {
    Prefer: "resolution=merge-duplicates,return=representation",
  });
}

export async function listNavigationChildren(parentId) {
  return supabaseRequest("GET", `/rest/v1/cms_navigation?select=id&parent_id=eq.${encodeURIComponent(parentId)}&limit=1`);
}

export async function deleteNavigation(id) {
  return supabaseRequest("DELETE", `/rest/v1/cms_navigation?id=eq.${encodeURIComponent(id)}`);
}

function moduleFilter(module) {
  if (!module) return "";
  const m = encodeURIComponent(module);
  return `&or=(module.ilike.*${m}*,module_id.eq.${m})`;
}

export async function listMaterials({ module = "", page = 1, limit = 9, publishedOnly = true, slug = "" }) {
  let visibilityFilter = "";
  if (publishedOnly) {
    const navigation = await listNavigation({ publishedOnly: false });
    if (!navigation.ok) return { ok: false, error: navigation.error };
    const { visible } = navigationVisibility(navigation.data);
    const hidden = navigation.data.filter((item) => !visible(item));
    const slugs = hidden.filter((item) => item.page).flatMap((item) => [item.page, `erp-${item.page}`]);
    const modules = hidden.filter((item) => !item.page).map((item) => item.id);
    const values = (entries) => entries.map((value) => encodeURIComponent(value)).join(",");
    if (slugs.length) visibilityFilter += `&slug=not.in.(${values(slugs)})`;
    if (modules.length) visibilityFilter += `&or=(module_id.is.null,module_id.not.in.(${values(modules)}))`;
  }
  if (slug) {
    const filter = publishedOnly ? `&published=eq.true${visibilityFilter}` : "";
    const result = await supabaseRequest("GET", `/rest/v1/cms_materials?select=*&slug=eq.${encodeURIComponent(slug)}${filter}&limit=1`);
    return { single: true, ok: result.ok, data: result.data?.[0] || null, error: result.error };
  }
  const offset = (page - 1) * limit;
  const published = publishedOnly ? `&published=eq.true${visibilityFilter}` : "";
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
