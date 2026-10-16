const baseUrl = () => (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export async function supabaseRequest(method, path, body, extraHeaders) {
  const url = baseUrl();
  const key = serviceKey();
  if (!url || !key) {
    return { ok: false, data: null, error: "Supabase is not configured" };
  }
  try {
    const response = await fetch(url + path, {
      method,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(extraHeaders || {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    let total = null;
    const range = response.headers.get("content-range");
    if (range) {
      const parts = range.split("/");
      if (parts.length === 2 && parts[1] !== "*") {
        const n = Number(parts[1]);
        if (Number.isFinite(n)) total = n;
      }
    }
    return {
      ok: response.ok,
      data,
      total,
      error: response.ok
        ? null
        : data?.message || data?.hint || data?.details || data?.error || `Supabase returned HTTP ${response.status}`,
    };
  } catch {
    return { ok: false, data: null, error: "Could not reach Supabase" };
  }
}

export function supabaseBaseUrl() {
  return baseUrl();
}

export function storageBucket() {
  return process.env.CMS_STORAGE_BUCKET || "cms-materials";
}
