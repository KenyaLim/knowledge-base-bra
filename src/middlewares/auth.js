import { COOKIE_NAME, SESSION_MS, readSessionFromToken, refreshSession, cookieOptions } from "../utils/session.js";

export async function requireSession(req, res, next) {
  const secret = process.env.AUTH_SECRET || "";
  const token = req.cookies?.[COOKIE_NAME];
  const session = await readSessionFromToken(token, secret);
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  req.session = session;
  try {
    const refreshed = await refreshSession(secret, session);
    res.cookie(COOKIE_NAME, refreshed, cookieOptions(Math.floor(SESSION_MS / 1000), req.secure || req.headers["x-forwarded-proto"] === "https"));
  } catch { /* ignore */ }
  return next();
}
