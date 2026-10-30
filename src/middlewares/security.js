import { createHmac } from "node:crypto";
import { supabaseRequest } from "../config/supabase.js";

export function sameOrigin(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  const expected = process.env.APP_ORIGIN || (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1" ? `${req.protocol}://${req.get("host")}` : "");
  if (!expected || origin !== expected || req.get("sec-fetch-site") === "cross-site") return res.status(403).json({ error: "Permintaan ditolak" });
  return next();
}

export async function rateLimit(scope, value, limit = 10) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  const bucket = createHmac("sha256", secret).update(`${scope}:${String(value).toLowerCase()}`).digest("hex");
  const result = await supabaseRequest("POST", "/rest/v1/rpc/kb_rate_limit", { bucket, max_attempts: limit, seconds: 900 });
  return result.ok && result.data === true;
}
