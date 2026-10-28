import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./src/routes/auth.js";
import cmsRoutes from "./src/routes/cms.js";
import { getDynamicPage } from "./src/controllers/cmsController.js";
import { requireSession } from "./src/middlewares/auth.js";
import { COOKIE_NAME, SESSION_MS, cookieOptions, isCmsAdmin, readSessionFromToken, refreshSession, safeNext } from "./src/utils/session.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", authRoutes);
  app.use("/api/cms", cmsRoutes);
  app.get("/docs/:page", requireSession, getDynamicPage);

  app.use("/css", express.static(path.join(ROOT, "css")));
  app.use("/js", express.static(path.join(ROOT, "js")));

  app.use(async (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    if (req.path.startsWith("/css/") || req.path.startsWith("/js/")) return next();
    if (req.path === "/favicon.ico") return next();
    if (req.method !== "GET") return next();
    if (!req.path.endsWith(".html") && req.path !== "/") return next();

    const secret = process.env.AUTH_SECRET || "";
    const token = req.cookies?.[COOKIE_NAME];
    const session = await readSessionFromToken(token, secret);
    const isLogin = req.path === "/login.html";
    const isAdminPage = req.path === "/admin.html";

    if (isLogin) {
      if (session) return res.redirect(safeNext(req.query.next, `${req.protocol}://${req.get("host")}`));
      return next();
    }
    if (isAdminPage && !isCmsAdmin(session)) {
      return res.redirect(new URL("/index.html", `${req.protocol}://${req.get("host")}`).toString());
    }
    if (session) {
      try {
        const refreshed = await refreshSession(secret, session);
        res.cookie(COOKIE_NAME, refreshed, cookieOptions(Math.floor(SESSION_MS / 1000), req.secure));
      } catch { /* ignore */ }
      res.set("Cache-Control", "private, no-store");
      return next();
    }
    const login = new URL("/login.html", `${req.protocol}://${req.get("host")}`);
    login.searchParams.set("next", req.path + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""));
    return res.redirect(login.toString());
  });

  app.use(express.static(ROOT, { extensions: ["html"] }));

  app.get("/healthz", (req, res) => res.json({ ok: true }));
  return app;
}

if (process.env.VERCEL !== "1") {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, () => console.log(`Knowledge base Express running on http://localhost:${port}`));
}
