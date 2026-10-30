export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveIdentity(session, authenticatedLogin = false) {
  if (!session) return null;
  if (!session.id) return process.env.AUTH_MODE === "enforce" ? null : session;
  if (!uuidPattern.test(session.id)) return null;
  const base = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return null;
  try {
    const response = await fetch(`${base}/rest/v1/kb_profiles?id=eq.${session.id}&select=id,email,name,role,status,session_version`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const rows = await response.json();
    const profile = rows?.[0];
    if (!profile || profile.id !== session.id || profile.status !== "active" || !Number.isSafeInteger(profile.session_version)) return null;
    if (!authenticatedLogin && session.v !== profile.session_version) return null;
    return { ...session, v: profile.session_version, e: profile.email, n: profile.name, r: profile.role, db: true };
  } catch {
    return null;
  }
}
