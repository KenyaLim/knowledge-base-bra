const COOKIE_NAME = "kb_session";
const SESSION_MS = 1000 * 60 * 60 * 12;

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

    if (isPublicAsset(path)) {
        return next();
    }

    const secret = process.env.AUTH_SECRET || "";
    const session = await readSession(request, secret);

    if (path === "/login.html") {
        if (session) {
            return redirectTo(safeNext(url.searchParams.get("next"), url.origin));
        }
        return next();
    }

    if (session) {
        return next({
            headers: {
                "Cache-Control": "private, no-store"
            }
        });
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
    const username = (process.env.AUTH_USERNAME || "").trim();
    const password = process.env.AUTH_PASSWORD || "";
    const secret = process.env.AUTH_SECRET || "";

    if (!username || !password || !secret) {
        return redirectTo(loginUrl(url.origin, "config", "/index.html"));
    }

    let submittedUser = "";
    let submittedPassword = "";
    let nextPath = "/index.html";

    try {
        const form = await request.formData();
        submittedUser = String(form.get("username") || "").trim();
        submittedPassword = String(form.get("password") || "");
        nextPath = safeNext(String(form.get("next") || "/index.html"));
    } catch {
        return redirectTo(loginUrl(url.origin, "invalid", "/index.html"));
    }

    const userOk = await secretsEqual(secret, submittedUser, username);
    const passOk = await secretsEqual(secret, submittedPassword, password);

    if (!userOk || !passOk) {
        return redirectTo(loginUrl(url.origin, "invalid", nextPath));
    }

    const token = await createSession(secret, submittedUser);
    const response = redirectTo(new URL(nextPath, url.origin).toString());

    response.headers.append(
        "Set-Cookie",
        cookieValue(token, Math.floor(SESSION_MS / 1000), url.protocol === "https:")
    );

    return response;
}

function handleLogout(url) {
    const response = redirectTo(new URL("/login.html", url.origin).toString());

    response.headers.append(
        "Set-Cookie",
        cookieValue("", 0, url.protocol === "https:")
    );

    return response;
}

async function createSession(secret, username) {
    const payload = encodePayload({
        u: username,
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
        return data;
    } catch {
        return null;
    }
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
