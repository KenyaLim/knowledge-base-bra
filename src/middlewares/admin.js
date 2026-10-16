import { isCmsAdmin } from "../utils/session.js";

export function requireAdmin(req, res, next) {
  if (!isCmsAdmin(req.session)) return res.status(403).json({ error: "Forbidden" });
  return next();
}
