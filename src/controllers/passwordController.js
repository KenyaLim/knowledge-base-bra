import { rateLimit } from "../middlewares/security.js";

export async function setupPassword(req, res) {
  res.set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
  const fail = () => res.status(400).json({ error: "Tautan tidak valid atau kedaluwarsa. Minta email baru." });
  const { token_hash, type, password } = req.body || {};
  if (!["invite", "recovery"].includes(type) || typeof token_hash !== "string" || token_hash.length < 16 || token_hash.length > 256 || typeof password !== "string" || password.length < 12 || password.length > 128) return fail();
  if (!await rateLimit("password-token", token_hash, 5)) return fail();
  const base = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_ANON_KEY;
  if (!base || !key) return fail();
  try {
    const verified = await fetch(`${base}/auth/v1/verify`, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({ token_hash, type }) });
    if (!verified.ok) return fail();
    const data = await verified.json();
    if (!data.access_token || !data.user?.id) return fail();
    const updated = await fetch(`${base}/auth/v1/user`, { method: "PUT", headers: { apikey: key, Authorization: `Bearer ${data.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    await fetch(`${base}/auth/v1/logout?scope=global`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${data.access_token}` } });
    if (!updated.ok) return fail();
    return res.json({ ok: true });
  } catch {
    return fail();
  }
}
