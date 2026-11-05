import {
  COOKIE_NAME,
  SESSION_MS,
  authenticateWithManualUser,
  authenticateWithSupabase,
  cookieOptions,
  createSession,
  isCmsAdmin,
  loginUrl,
  parseManualUsers,
  readSessionFromToken,
  refreshSession,
  safeNext,
} from "../utils/session.js";

import { authenticateDatabaseUser } from "../models/userModel.js";
import { supabaseRequest } from "../config/supabase.js";
import { sign } from "../utils/session.js";

const fallbackAttempts = new Map();

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
  const reserved = parseManualUsers(process.env.MANUAL_USERS || "").some((entry) => entry.username.toLowerCase() === identity.toLowerCase());
  const key = sign(secret, `login:${identity.toLowerCase()}`);
  const limit = await supabaseRequest("POST", "/rest/v1/rpc/kb_action_limit", { p_key: key, p_limit: 10, p_seconds: 900 });
  if (limit.ok && limit.data !== true) return res.status(429).json({ error: "Terlalu banyak percobaan login" });
  if (!limit.ok) {
    if (!reserved && !(supabaseUrl && supabaseAnonKey)) return res.status(503).json({ error: "Layanan login belum tersedia" });
    const previous = fallbackAttempts.get(key);
    const entry = previous && previous.expires > Date.now() ? previous : { count: 0, expires: Date.now() + 900000 };
    entry.count += 1;
    fallbackAttempts.set(key, entry);
    if (entry.count > 10) return res.sendStatus(429);
  }
  let user = await authenticateWithManualUser(secret, identity, password);
  if (!user && !reserved && limit.ok) user = await authenticateDatabaseUser(identity, password);
  if (!user && !reserved && supabaseUrl && supabaseAnonKey) {
    user = await authenticateWithSupabase(supabaseUrl, supabaseAnonKey, identity, password);
  }
  if (!user) return res.redirect(loginUrl(originOf(req), "invalid", nextPath));
  const token = await createSession(secret, user);
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
