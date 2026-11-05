import { randomBytes } from "node:crypto";
import { decodePayload, sign, timingSafeEqual } from "../utils/session.js";

function sessionBinding(req) {
  const token = req.cookies?.kb_session || "";
  if (!token) return "anonymous";
  const split = token.lastIndexOf(".");
  const payload = token.slice(0, split);
  if (split < 1 || !timingSafeEqual(token.slice(split + 1), sign(process.env.AUTH_SECRET, payload))) return "invalid";
  try {
    const session = decodePayload(payload);
    return JSON.stringify([session.provider, session.sub, session.v, session.exp]);
  } catch {
    return "invalid";
  }
}

export function csrf(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const expected = `${req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http"}://${req.get("host")}`;
  const origin = req.get("origin");
  if (origin) {
    if (origin !== expected) return res.status(403).json({ error: "Origin ditolak" });
    return next();
  }
  const token = req.get("x-csrf-token") || req.body?._csrf || "";
  const [nonce, signature] = String(token).split(".");
  if (nonce && process.env.AUTH_SECRET && timingSafeEqual(signature, sign(process.env.AUTH_SECRET, `csrf:${nonce}:${sessionBinding(req)}`))) return next();
  return res.status(403).json({ error: "Token CSRF diperlukan" });
}

export function csrfToken(req, res) {
  if (!process.env.AUTH_SECRET) return res.sendStatus(503);
  const nonce = randomBytes(32).toString("hex");
  res.set("Cache-Control", "no-store").json({ token: `${nonce}.${sign(process.env.AUTH_SECRET, `csrf:${nonce}:${sessionBinding(req)}`)}` });
}
