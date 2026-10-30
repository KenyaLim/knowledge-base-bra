import {
  COOKIE_NAME,
  SESSION_MS,
  authenticateWithManualUser,
  authenticateWithSupabase,
  cookieOptions,
  createSession,
  isCmsAdmin,
  loginUrl,
  readSessionFromToken,
  refreshSession,
  safeNext,
} from "../utils/session.js";

import { rateLimit } from "../middlewares/security.js";

function originOf(req) {
  return `${req.protocol}://${req.get("host")}`;
}

export async function login(req, res) {
  const secret = process.env.AUTH_SECRET || "";
  const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
  if (!secret) return res.redirect(loginUrl(originOf(req), "config", "/index.html"));
  const identity = String(req.body?.identity || req.body?.email || "").trim();
  const password = String(req.body?.password || "");
  const nextPath = safeNext(String(req.body?.next || "/index.html"));
  const enforce = process.env.AUTH_MODE === "enforce";
  if (enforce && !await rateLimit("login", identity, 10)) return res.redirect(loginUrl(originOf(req), "invalid", nextPath));
  let user = enforce ? false : await authenticateWithManualUser(secret, identity, password);
  if (!user && supabaseUrl && supabaseAnonKey) {
    if (!enforce && !await rateLimit("login", identity, 10)) return res.redirect(loginUrl(originOf(req), "invalid", nextPath));
    user = await authenticateWithSupabase(supabaseUrl, supabaseAnonKey, identity, password);
  }
  if (!user) return res.redirect(loginUrl(originOf(req), "invalid", nextPath));
  const token = await createSession(secret, {
    id: user.id,
    session_version: user.session_version,
    email: user.email || identity,
    name: user.name || user.user_metadata?.full_name || user.user_metadata?.name || "",
    role: user.role || "user",
  });
  res.cookie(COOKIE_NAME, token, cookieOptions(Math.floor(SESSION_MS / 1000), req.secure || req.headers["x-forwarded-proto"] === "https"));
  return res.redirect(new URL(nextPath, originOf(req)).toString());
}

export async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  return res.redirect(new URL("/login.html", originOf(req)).toString());
}

export async function session(req, res) {
  const secret = process.env.AUTH_SECRET || "";
  const token = req.cookies?.[COOKIE_NAME];
  const session = await readSessionFromToken(token, secret);
  res.set("Cache-Control", "no-store");
  if (!session) return res.status(401).json({ authenticated: false });
  try {
    const refreshed = await refreshSession(secret, session);
    res.cookie(COOKIE_NAME, refreshed, cookieOptions(Math.floor(SESSION_MS / 1000), req.secure || req.headers["x-forwarded-proto"] === "https"));
  } catch { /* ignore */ }
  res.set("Cache-Control", "private, no-store");
  return res.json({
    authenticated: true,
    email: session.e || session.u || "",
    name: session.n || "",
    role: session.r || "user",
    isAdmin: isCmsAdmin(session),
  });
}
