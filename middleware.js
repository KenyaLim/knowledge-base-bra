const COOKIE_NAME = "kb_session";
const SESSION_MS = 1000 * 60 * 60 * 12;
const IDLE_SESSION_MS = 1000 * 60 * 7;

// Thin Vercel Middleware: hanya guard halaman.
// Semua /api/* diandalkan ke Express (api/index.js -> src/routes/* -> src/controllers/* -> src/models/*).
// Jangan taruh logika API di sini lagi agar tidak dobel dengan Express.

export const config = {
    matcher: ["/((?!_vercel|favicon.ico).*)"]
};

export default async function middleware(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith("/api/")) {
        return next();
    }

    if (isPublicAsset(path)) {
        return next();
    }

    const secret = process.env.AUTH_SECRET || "";
    let session = await readSession(request, secret);
    if (session?.provider === "database") {
        try {
            const verification = await fetch(new URL("/api/session", url.origin), {
                headers: { cookie: `${COOKIE_NAME}=${getCookie(request, COOKIE_NAME)}` },
                redirect: "error",
                cache: "no-store"
            });
            const verified = verification.ok ? await verification.json() : null;
            session = verified?.authenticated ? { ...session, r: verified.role } : null;
        } catch {
            session = null;
        }
    }

    if (["/admin.html", "/admin", "/users.html", "/users", "/faq-admin.html", "/faq-admin"].includes(path) && !isCmsAdmin(session)) {
        return redirectTo(new URL("/index.html", url.origin).toString());
    }

    if (["/login.html", "/login"].includes(path)) {
        if (session) {
            return redirectTo(safeNext(url.searchParams.get("next"), url.origin));
        }
        return next();
    }

    if (session) {
        if (/^\/(?:docs|erp|stage|proman)\//.test(decodeURIComponent(path))) {
            try {
                const access = await fetch(new URL(`/api/cms/access?path=${encodeURIComponent(path)}`, url.origin), {
                    headers: { cookie: `${COOKIE_NAME}=${getCookie(request, COOKIE_NAME)}` },
                    redirect: "error",
                    cache: "no-store"
                });
                if (!access.ok || (await access.json()).allowed !== true) return new Response("Page unavailable", { status: access.status === 404 ? 404 : 502, headers: { "Cache-Control": "private, no-store" } });
            } catch {
                return new Response("Page unavailable", { status: 502, headers: { "Cache-Control": "private, no-store" } });
            }
        }
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
    if (path.startsWith("/css/")) return true;
    if (path.startsWith("/js/")) return true;
    return false;
}

function isCmsAdmin(session) {
    if (!session) return false;
    if (session.r === "admin") return true;
    if (session.provider === "database") return false;
    const admins = (process.env.CMS_ADMIN_EMAILS || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
    return admins.includes(String(session.e || session.u || "").toLowerCase());
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
        sub: session.sub,
        provider: session.provider,
        v: session.v,
        e: session.e || session.u || "",
        n: session.n || "",
        r: session.r === "admin" ? "admin" : "user",
        a: Date.now(),
        exp: session.exp
    });
    return `${payload}.${await sign(secret, payload)}`;
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
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function decodePayload(value) {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (padded.length % 4)) % 4;
    const binary = atob(padded + "=".repeat(padLength));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
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
    try {
        const decoded = decodeURIComponent(value);
        if (/[\\\u0000-\u001f\u007f]/.test(value) || /[\\\u0000-\u001f\u007f]/.test(decoded)) return fallback;
        const base = new URL(origin || "https://localhost");
        const target = new URL(value, base);
        const normalized = new URL(decoded, base);
        if (target.origin !== base.origin || normalized.origin !== base.origin) return fallback;
        if (["/login", "/login.html"].includes(normalized.pathname)) return fallback;
        return origin ? target.toString() : value;
    } catch {
        return fallback;
    }
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
