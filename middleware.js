const COOKIE_NAME = "kb_session";
const SESSION_MS = 1000 * 60 * 60 * 12;
const IDLE_SESSION_MS = 1000 * 60 * 30;

const PUBLIC_PATHS = ["/api/login", "/api/logout"];

export const config = {
    matcher: ["/((?!_vercel|favicon.ico).*)"]
};

export default async function middleware(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (method === "POST" && path === "/api/login") {
        return handleLogin(request, url);
    }

    if (method === "POST" && path === "/api/logout") {
        return handleLogout(url);
    }

    if (method === "GET" && path === "/api/session") {
        return handleSession(request);
    }

    if (path === "/api/cms/content" && method === "GET") {
        return handleCmsContent(request);
    }

    if (path === "/api/cms/modules" && method === "GET") {
        return handleCmsModules(request);
    }

    if (path === "/api/cms/admin/content" && ["GET", "POST", "DELETE"].includes(method)) {
        return handleCmsAdminContent(request, method);
    }

    if (path === "/api/cms/admin/modules" && ["GET", "POST"].includes(method)) {
        return handleCmsAdminModules(request, method);
    }

    if (path === "/api/cms/admin/upload" && method === "POST") {
        return handleCmsAdminUpload(request);
    }

    if (isPublicAsset(path)) {
        return next();
    }

    const secret = process.env.AUTH_SECRET || "";
    const session = await readSession(request, secret);

    if (path === "/admin.html" && !isCmsAdmin(session)) {
        return redirectTo(new URL("/index.html", url.origin).toString());
    }

    if (path === "/login.html") {
        if (session) {
            return redirectTo(safeNext(url.searchParams.get("next"), url.origin));
        }
        return next();
    }

    if (session) {
        const response = next({
            headers: {
                "Cache-Control": "private, no-store"
            }
        });
        response.headers.set(
            "Set-Cookie",
            cookieValue(
                await refreshSession(secret, session),
                Math.floor(SESSION_MS / 1000),
                url.protocol === "https:"
            )
        );
        return response;
    }

    const login = new URL("/login.html", url.origin);
    login.searchParams.set("next", path + url.search);
    return Response.redirect(login.toString(), 302);
}

function isPublicAsset(path) {
    if (PUBLIC_PATHS.includes(path)) return true;
    if (path.startsWith("/css/")) return true;
    if (path.startsWith("/js/")) return true;
    return false;
}

async function handleLogin(request, url) {
    const secret = process.env.AUTH_SECRET || "";
    const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseAnonKey || !secret) {
        return redirectTo(loginUrl(url.origin, "config", "/index.html"));
    }

    let submittedEmail = "";
    let submittedPassword = "";
    let nextPath = "/index.html";

    try {
        const form = await request.formData();
        submittedEmail = String(form.get("email") || "").trim();
        submittedPassword = String(form.get("password") || "");
        nextPath = safeNext(String(form.get("next") || "/index.html"));
    } catch {
        return redirectTo(loginUrl(url.origin, "invalid", "/index.html"));
    }

    const user = await authenticateWithSupabase(
        supabaseUrl,
        supabaseAnonKey,
        submittedEmail,
        submittedPassword
    );

    if (!user) {
        return redirectTo(loginUrl(url.origin, "invalid", nextPath));
    }

    const token = await createSession(secret, {
        email: submittedEmail,
        name: user.user_metadata?.full_name || user.user_metadata?.name || ""
    });
    const response = redirectTo(new URL(nextPath, url.origin).toString());

    response.headers.append(
        "Set-Cookie",
        cookieValue(token, Math.floor(SESSION_MS / 1000), url.protocol === "https:")
    );

    return response;
}

async function authenticateWithSupabase(url, anonKey, email, password) {
    if (!email || !password) return false;

    try {
        const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
            method: "POST",
            headers: {
                apikey: anonKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) return false;
        return await response.json();
    } catch {
        return false;
    }
}

async function handleSession(request) {
    const secret = process.env.AUTH_SECRET || "";
    const session = await readSession(request, secret);

    if (!session) {
        return Response.json({ authenticated: false }, {
            status: 401,
            headers: { "Cache-Control": "no-store" }
        });
    }

    return Response.json({
        authenticated: true,
        email: session.e || session.u || "",
        name: session.n || "",
        isAdmin: isCmsAdmin(session)
    }, {
        headers: {
            "Cache-Control": "private, no-store",
            "Set-Cookie": cookieValue(
                await refreshSession(secret, session),
                Math.floor(SESSION_MS / 1000),
                new URL(request.url).protocol === "https:"
            )
        }
    });
}

async function handleCmsContent(request) {
    const session = await readSession(request, process.env.AUTH_SECRET || "");
    if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

    const slug = new URL(request.url).searchParams.get("slug");
    const query = slug
        ? `?select=*&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`
        : "?select=*&published=eq.true&order=sort_order.asc,created_at.asc";
    const result = await supabaseRequest("GET", "/rest/v1/cms_materials" + query);

    if (!result.ok) return jsonResponse({ error: "CMS database request failed" }, 502);
    return jsonResponse(slug ? (result.data[0] || null) : result.data);
}

async function handleCmsModules(request) {
    const session = await readSession(request, process.env.AUTH_SECRET || "");
    if (!session) return jsonResponse({ error: "Unauthorized" }, 401);

    const modulesResult = await supabaseRequest(
        "GET",
        "/rest/v1/cms_modules?select=*&order=sort_order.asc,created_at.asc"
    );

    const materialsResult = await supabaseRequest(
        "GET",
        "/rest/v1/cms_materials?select=*&published=eq.true&order=sort_order.asc,created_at.asc"
    );

    if (!modulesResult.ok || !materialsResult.ok) {
        return jsonResponse(defaultModuleTree(), 200);
    }

    const modules = modulesResult.data || [];
    const materials = materialsResult.data || [];
    const list = modules.length
        ? modules.map(function (module) {
            const children = materials
                .filter(function (material) {
                    return (material.module_id || material.module || "").toLowerCase() === String(module.slug || "").toLowerCase();
                })
                .map(function (material) {
                    return {
                        slug: material.slug,
                        title: material.title,
                        page: material.slug,
                        url: `material.html?slug=${encodeURIComponent(material.slug)}`,
                        kind: material.kind || "detail",
                        summary: material.summary || "",
                        content: material.content || "",
                        pdf_url: material.pdf_url || "",
                        image_url: material.image_url || "",
                        sort_order: Number(material.sort_order) || 0
                    };
                });
            return {
                slug: module.slug,
                title: module.title,
                icon: module.icon || "ph-files",
                sort_order: Number(module.sort_order) || 0,
                children: children.length ? children : defaultChildrenForModule(module.slug)
            };
        })
        : defaultModuleTree();

    return jsonResponse(list);
}

async function handleCmsAdminModules(request, method) {
    const session = await readSession(request, process.env.AUTH_SECRET || "");
    if (!isCmsAdmin(session)) return jsonResponse({ error: "Forbidden" }, 403);

    if (method === "GET") {
        return handleCmsModules(request);
    }

    let modules;
    try {
        modules = await request.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    if (!Array.isArray(modules)) {
        return jsonResponse({ error: "Expected an array of modules" }, 400);
    }

    const saved = [];
    for (let index = 0; index < modules.length; index += 1) {
        const module = modules[index];
        const moduleSlug = String(module.slug || module.id || module.title || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
        if (!moduleSlug) continue;

        const modulePayload = {
            slug: moduleSlug,
            title: String(module.title || moduleSlug).trim(),
            icon: String(module.icon || "ph-files").trim() || "ph-files",
            sort_order: Number.isFinite(Number(module.sort_order)) ? Number(module.sort_order) : index
        };

        const moduleUpsert = await supabaseRequest(
            "POST",
            "/rest/v1/cms_modules?on_conflict=slug",
            modulePayload,
            { Prefer: "resolution=merge-duplicates,return=representation" }
        );

        if (!moduleUpsert.ok) {
            return jsonResponse({ error: "Could not save module config" }, 502);
        }

        const savedModule = (moduleUpsert.data && moduleUpsert.data[0]) || modulePayload;
        const children = Array.isArray(module.children) ? module.children : [];
        for (let childIndex = 0; childIndex < children.length; childIndex += 1) {
            const child = children[childIndex];
            const childSlug = String(child.slug || child.page || child.title || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
            if (!childSlug) continue;
            const pagePayload = {
                slug: childSlug,
                title: String(child.title || childSlug).trim(),
                module: savedModule.title,
                module_id: savedModule.slug,
                kind: child.kind === "overview" ? "overview" : "detail",
                summary: String(child.summary || "").trim(),
                content: String(child.content || ""),
                pdf_url: String(child.pdf_url || "").trim(),
                image_url: child.kind === "overview" ? "" : String(child.image_url || "").trim(),
                published: true,
                sort_order: Number.isFinite(Number(child.sort_order)) ? Number(child.sort_order) : childIndex
            };

            const childUpsert = await supabaseRequest(
                "POST",
                "/rest/v1/cms_materials?on_conflict=slug",
                pagePayload,
                { Prefer: "resolution=merge-duplicates,return=representation" }
            );
            if (!childUpsert.ok) {
                return jsonResponse({ error: "Could not save module child content" }, 502);
            }
        }

        saved.push({
            ...savedModule,
            children: children.map(function (child) {
                return {
                    slug: String(child.slug || child.page || child.title || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
                    title: child.title || child.slug || child.page || "Untitled",
                    page: String(child.slug || child.page || child.title || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
                    url: `material.html?slug=${encodeURIComponent(String(child.slug || child.page || child.title || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}`,
                    kind: child.kind === "overview" ? "overview" : "detail",
                    summary: child.summary || "",
                    content: child.content || "",
                    pdf_url: child.pdf_url || "",
                    image_url: child.image_url || "",
                    sort_order: child.sort_order || 0
                };
            })
        });
    }

    return jsonResponse(saved, 200);
}

function defaultChildrenForModule(moduleSlug) {
    const defaults = {
        order: [
            { slug: "order-overview", title: "Overview", kind: "overview" },
            { slug: "order-entry", title: "Order", kind: "detail" }
        ],
        mrp: [
            { slug: "mrp-overview", title: "Overview", kind: "overview" },
            { slug: "mrp-material-requirement", title: "Material Requirement", kind: "detail" }
        ],
        purchase: [
            { slug: "purchase-overview", title: "Overview", kind: "overview" },
            { slug: "purchase-order", title: "Purchase Order", kind: "detail" },
            { slug: "purchase-material", title: "Purchase Material", kind: "detail" },
            { slug: "goods-receipt", title: "Goods Receipt", kind: "detail" }
        ],
        inventory: [
            { slug: "inventory-overview", title: "Overview", kind: "overview" },
            { slug: "inventory-stock", title: "Stock", kind: "detail" },
            { slug: "inventory-grn", title: "Goods Receipt", kind: "detail" }
        ],
        production: [
            { slug: "production-overview", title: "Overview", kind: "overview" },
            { slug: "production-cutting", title: "Cutting", kind: "detail" },
            { slug: "production-sewing", title: "Sewing", kind: "detail" }
        ],
        shipment: [
            { slug: "shipment-overview", title: "Overview", kind: "overview" },
            { slug: "shipment-packing", title: "Packing", kind: "detail" },
            { slug: "shipment-export", title: "Export", kind: "detail" }
        ]
    };

    return (defaults[moduleSlug] || []).map(function (child) {
        return {
            slug: child.slug,
            title: child.title,
            page: child.slug,
            url: `material.html?slug=${encodeURIComponent(child.slug)}`,
            kind: child.kind || "detail",
            pdf_url: "",
            image_url: "",
            summary: "",
            content: "",
            sort_order: 0
        };
    });
}

function defaultModuleTree() {
    return [
        { slug: "order", title: "Order", icon: "ph-shopping-cart", sort_order: 0, children: defaultChildrenForModule("order") },
        { slug: "mrp", title: "MRP", icon: "ph-chart-bar", sort_order: 1, children: defaultChildrenForModule("mrp") },
        { slug: "purchase", title: "Purchase", icon: "ph-receipt", sort_order: 2, children: defaultChildrenForModule("purchase") },
        { slug: "inventory", title: "Inventory", icon: "ph-package", sort_order: 3, children: defaultChildrenForModule("inventory") },
        { slug: "production", title: "Production", icon: "ph-factory", sort_order: 4, children: defaultChildrenForModule("production") },
        { slug: "shipment", title: "Shipment", icon: "ph-truck", sort_order: 5, children: defaultChildrenForModule("shipment") }
    ];
}

async function handleCmsAdminContent(request, method) {
    const session = await readSession(request, process.env.AUTH_SECRET || "");
    if (!isCmsAdmin(session)) return jsonResponse({ error: "Forbidden" }, 403);

    if (method === "GET") {
        const result = await supabaseRequest(
            "GET",
            "/rest/v1/cms_materials?select=*&order=sort_order.asc,created_at.asc"
        );
        if (!result.ok) return jsonResponse({ error: "CMS database request failed" }, 502);
        return jsonResponse(result.data);
    }

    if (method === "DELETE") {
        const id = new URL(request.url).searchParams.get("id");
        if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
            return jsonResponse({ error: "A valid material id is required" }, 400);
        }
        const result = await supabaseRequest(
            "DELETE",
            `/rest/v1/cms_materials?id=eq.${encodeURIComponent(id)}`
        );
        if (!result.ok) return jsonResponse({ error: "Could not delete CMS material" }, 502);
        return jsonResponse({ deleted: true });
    }

    let material;
    try {
        material = await request.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    const required = ["slug", "title"];
    if (!required.every((field) => typeof material[field] === "string" && material[field].trim())) {
        return jsonResponse({ error: "Slug and title are required" }, 400);
    }

    const payload = {
        slug: material.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
        title: material.title.trim(),
        module: String(material.module || "").trim(),
        module_id: String(material.module_id || material.module || "").trim().toLowerCase(),
        kind: material.kind === "overview" ? "overview" : "detail",
        summary: String(material.summary || "").trim(),
        content: String(material.content || ""),
        pdf_url: String(material.pdf_url || "").trim(),
        image_url: material.kind === "overview" ? "" : String(material.image_url || "").trim(),
        published: Boolean(material.published),
        sort_order: Number.isFinite(Number(material.sort_order)) ? Number(material.sort_order) : 0
    };
    const result = await supabaseRequest(
        "POST",
        "/rest/v1/cms_materials?on_conflict=slug",
        payload,
        { Prefer: "resolution=merge-duplicates,return=representation" }
    );

    if (!result.ok) return jsonResponse({ error: "Could not save CMS material" }, 502);
    return jsonResponse(result.data[0] || payload, 200);
}

async function handleCmsAdminUpload(request) {
    const session = await readSession(request, process.env.AUTH_SECRET || "");
    if (!isCmsAdmin(session)) return jsonResponse({ error: "Forbidden" }, 403);

    const bucket = process.env.CMS_STORAGE_BUCKET || "cms-materials";
    let file;
    try {
        const form = await request.formData();
        file = form.get("file");
    } catch {
        return jsonResponse({ error: "Invalid upload" }, 400);
    }
    if (!file || typeof file.arrayBuffer !== "function") {
        return jsonResponse({ error: "A file is required" }, 400);
    }
    if (file.size > 15 * 1024 * 1024) {
        return jsonResponse({ error: "File size must be 15 MB or less" }, 400);
    }
    if (!/^application\/pdf$|^image\/(png|jpeg|jpg|webp|gif)$/.test(file.type)) {
        return jsonResponse({ error: "Only PDF and image files are supported" }, 400);
    }

    const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "bin";
    const path = `${crypto.randomUUID()}.${extension}`;
    const baseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!baseUrl || !serviceKey) return jsonResponse({ error: "Storage is not configured" }, 502);

    try {
        const response = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${path}`, {
            method: "POST",
            headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                "Content-Type": file.type,
                "x-upsert": "true"
            },
            body: await file.arrayBuffer()
        });
        if (!response.ok) return jsonResponse({ error: "Could not upload file" }, 502);
        return jsonResponse({ url: `${baseUrl}/storage/v1/object/public/${bucket}/${path}` });
    } catch {
        return jsonResponse({ error: "Could not upload file" }, 502);
    }
}

function isCmsAdmin(session) {
    if (!session) return false;
    const admins = (process.env.CMS_ADMIN_EMAILS || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
    return admins.includes(String(session.e || session.u || "").toLowerCase());
}

async function supabaseRequest(method, path, body, extraHeaders) {
    const baseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!baseUrl || !serviceKey) return { ok: false, data: null };

    try {
        const response = await fetch(baseUrl + path, {
            method,
            headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                "Content-Type": "application/json",
                ...(extraHeaders || {})
            },
            body: body === undefined ? undefined : JSON.stringify(body)
        });
        const data = await response.json().catch(() => null);
        return { ok: response.ok, data };
    } catch {
        return { ok: false, data: null };
    }
}

function handleLogout(url) {
    const response = redirectTo(new URL("/login.html", url.origin).toString());

    response.headers.append(
        "Set-Cookie",
        cookieValue("", 0, url.protocol === "https:")
    );

    return response;
}

async function createSession(secret, user) {
    const payload = encodePayload({
        e: user.email,
        n: user.name,
        a: Date.now(),
        exp: Date.now() + SESSION_MS
    });
    const signature = await sign(secret, payload);
    return `${payload}.${signature}`;
}

async function readSession(request, secret) {
    if (!secret) return null;

    const token = getCookie(request, COOKIE_NAME);
    if (!token) return null;

    const splitAt = token.lastIndexOf(".");
    if (splitAt < 1) return null;

    const payload = token.slice(0, splitAt);
    const signature = token.slice(splitAt + 1);
    const expected = await sign(secret, payload);

    if (!timingSafeEqual(signature, expected)) return null;

    try {
        const data = decodePayload(payload);
        if (!data || typeof data.exp !== "number" || data.exp < Date.now()) {
            return null;
        }
        const lastActivity = typeof data.a === "number"
            ? data.a
            : data.exp - SESSION_MS;
        if (Date.now() - lastActivity >= IDLE_SESSION_MS) {
            return null;
        }
        data.a = lastActivity;
        return data;
    } catch {
        return null;
    }
}

async function refreshSession(secret, session) {
    const payload = encodePayload({
        e: session.e || session.u || "",
        n: session.n || "",
        a: Date.now(),
        exp: session.exp
    });
    return `${payload}.${await sign(secret, payload)}`;
}

async function secretsEqual(secret, submitted, expected) {
    const left = await sign(secret, submitted);
    const right = await sign(secret, expected);
    return timingSafeEqual(left, right);
}

async function sign(secret, value) {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(value)
    );
    return bufferToHex(signature);
}

function timingSafeEqual(a, b) {
    if (typeof a !== "string" || typeof b !== "string") return false;
    if (a.length !== b.length) return false;

    let mismatch = 0;
    for (let i = 0; i < a.length; i += 1) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}

function bufferToHex(buffer) {
    return [...new Uint8Array(buffer)]
        .map(function (byte) {
            return byte.toString(16).padStart(2, "0");
        })
        .join("");
}

function encodePayload(data) {
    return btoa(JSON.stringify(data))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function decodePayload(value) {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (padded.length % 4)) % 4;
    return JSON.parse(atob(padded + "=".repeat(padLength)));
}

function getCookie(request, name) {
    const header = request.headers.get("cookie") || "";
    const cookies = header.split(";");

    for (let i = 0; i < cookies.length; i += 1) {
        const part = cookies[i].trim();
        const eq = part.indexOf("=");
        if (eq === -1) continue;
        if (part.slice(0, eq) === name) {
            return part.slice(eq + 1);
        }
    }

    return null;
}

function safeNext(value, origin) {
    const fallback = "/index.html";
    if (!value || typeof value !== "string") return fallback;
    if (!value.startsWith("/")) return fallback;
    if (value.startsWith("//")) return fallback;
    if (value.includes("://")) return fallback;
    if (value === "/login.html" || value.startsWith("/login.html?")) return fallback;
    if (origin) return new URL(value, origin).toString();
    return value;
}

function loginUrl(origin, error, nextPath) {
    const url = new URL("/login.html", origin);
    url.searchParams.set("error", error);
    url.searchParams.set("next", nextPath);
    return url.toString();
}

function cookieValue(token, maxAge, secure) {
    const parts = [
        `${COOKIE_NAME}=${token}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        `Max-Age=${maxAge}`
    ];

    if (secure) {
        parts.push("Secure");
    }

    return parts.join("; ");
}

function next(options) {
    const headers = new Headers(options && options.headers ? options.headers : undefined);
    headers.set("x-middleware-next", "1");
    return new Response(null, { headers });
}

function redirectTo(location) {
    return new Response(null, {
        status: 302,
        headers: {
            Location: location,
            "Cache-Control": "no-store"
        }
    });
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
        }
    });
}
