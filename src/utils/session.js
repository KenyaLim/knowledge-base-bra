import { createHmac, randomUUID } from "node:crypto";
import { resolveIdentity } from "./identity.js";

export const COOKIE_NAME = "kb_session";
export const SESSION_MS = 1000 * 60 * 60 * 12;
export const IDLE_SESSION_MS = 1000 * 60 * 7;
export const DEFAULT_PAGE_LIMIT = 9;
export const MAX_PAGE_LIMIT = 50;

export function sign(secret, value) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function encodePayload(data) {
  return Buffer.from(JSON.stringify(data))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function decodePayload(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return JSON.parse(Buffer.from(padded + "=".repeat(padLength), "base64").toString("utf8"));
}

export function newId() {
  return randomUUID();
}

export async function createSession(secret, user) {
  const payload = encodePayload({
    id: user.id,
    v: user.session_version,
    e: user.email,
    n: user.name,
    r: user.role === "admin" ? "admin" : "user",
    a: Date.now(),
    exp: Date.now() + SESSION_MS,
  });
  return `${payload}.${sign(secret, payload)}`;
}

export async function readSessionFromToken(token, secret) {
  if (!secret || !token) return null;
  const splitAt = token.lastIndexOf(".");
  if (splitAt < 1) return null;
  const payload = token.slice(0, splitAt);
  const signature = token.slice(splitAt + 1);
  if (!timingSafeEqual(signature, sign(secret, payload))) return null;
  try {
    const data = decodePayload(payload);
    if (!data || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    const lastActivity = typeof data.a === "number" ? data.a : data.exp - SESSION_MS;
    if (Date.now() - lastActivity >= IDLE_SESSION_MS) return null;
    data.a = lastActivity;
    return await resolveIdentity(data);
  } catch {
    return null;
  }
}

export async function refreshSession(secret, session) {
  const payload = encodePayload({
    id: session.id,
    v: session.v,
    e: session.e || session.u || "",
    n: session.n || "",
    r: session.r === "admin" ? "admin" : "user",
    a: Date.now(),
    exp: session.exp,
  });
  return `${payload}.${sign(secret, payload)}`;
}

export async function secretsEqual(secret, submitted, expected) {
  return timingSafeEqual(sign(secret, submitted), sign(secret, expected));
}

export function parseManualUsers(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    const entries = Array.isArray(parsed)
      ? parsed
      : Object.entries(parsed).map(([username, details]) => ({
          username,
          ...(typeof details === "string" ? { password: details } : details),
        }));
    return entries
      .filter((user) => user && typeof user === "object")
      .map((user) => ({
        username: String(user.username || user.user || "").trim(),
        password: String(user.password || ""),
        name: String(user.name || user.username || user.user || "").trim(),
        role: user.role === "admin" ? "admin" : "user",
      }))
      .filter((user) => user.username && user.password);
  } catch {
    return [];
  }
}

export async function authenticateWithManualUser(secret, identity, password) {
  if (!identity || !password) return false;
  const configuredUsers = parseManualUsers(process.env.MANUAL_USERS || "");
  const user = configuredUsers.find(
    (candidate) => candidate.username.toLowerCase() === identity.toLowerCase()
  );
  if (!user || !(await secretsEqual(secret, password, user.password))) return false;
  return { email: user.username, name: user.name, role: user.role };
}

export async function authenticateWithSupabase(url, anonKey, email, password) {
  if (!email || !password) return false;
  try {
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    if (!data.user?.id) return false;
    const profile = await resolveIdentity({ id: data.user.id }, true);
    if (!profile) return false;
    return { id: profile.id, session_version: profile.v, email: profile.e, name: profile.n, role: profile.r };
  } catch {
    return false;
  }
}

export function isCmsAdmin(session) {
  if (!session) return false;
  if (session.id) return session.db === true && session.r === "admin";
  if (process.env.AUTH_MODE === "enforce") return false;
  if (session.r === "admin") return true;
  const admins = (process.env.CMS_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(String(session.e || session.u || "").toLowerCase());
}

export function safeNext(value, origin) {
  const fallback = "/index.html";
  if (!value || typeof value !== "string") return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("://")) return fallback;
  if (value === "/login.html" || value.startsWith("/login.html?")) return fallback;
  if (origin) return new URL(value, origin).toString();
  return value;
}

export function loginUrl(origin, error, nextPath) {
  const url = new URL("/login.html", origin);
  url.searchParams.set("error", error);
  url.searchParams.set("next", nextPath);
  return url.toString();
}

export function cookieOptions(maxAge, secure) {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAge * 1000,
    secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1" || Boolean(secure),
  };
}

export function parsePaging(query, defaults = {}) {
  const limit = Math.min(
    MAX_PAGE_LIMIT,
    Math.max(1, Number.parseInt(query.limit ?? defaults.limit ?? DEFAULT_PAGE_LIMIT, 10) || DEFAULT_PAGE_LIMIT)
  );
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const module = String(query.module ?? query.module_id ?? "").trim().toLowerCase();
  const slug = String(query.slug ?? "").trim();
  const usePaging = query.page !== undefined || query.limit !== undefined || query.module !== undefined;
  return { page, limit, module, slug, usePaging };
}
