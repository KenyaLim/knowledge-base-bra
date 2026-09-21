const COOKIE_NAME = "kb_session";

export default async function handler(request) {
    const session = await readSession(request, process.env.AUTH_SECRET || "");

    if (!session) {
        return json({ error: "Unauthorized" }, 401);
    }

    const isAdmin = isAllowedAdmin(session.u);
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (method === "GET") {
        if (!url.searchParams.has("slug") && !isAdmin) {
            return json({ error: "Forbidden" }, 403);
        }

        return listDocuments(url.searchParams, isAdmin);
    }

    if (!isAdmin) {
        return json({ error: "Forbidden" }, 403);
    }

    if (method === "POST") return createDocument(request);
    if (method === "PATCH") return updateDocument(request);
    if (method === "DELETE") return deleteDocument(url.searchParams);

    return json({ error: "Method not allowed" }, 405);
}

async function listDocuments(searchParams, isAdmin) {
    const filters = ["select=*"];
    const slug = searchParams.get("slug");

    if (slug) filters.push(`slug=eq.${encodeURIComponent(slug)}`);
    if (!isAdmin) filters.push("published=eq.true");
    filters.push("order=updated_at.desc");

    const response = await supabaseRequest(`/rest/v1/documents?${filters.join("&")}`);
    return proxyResponse(response);
}

async function createDocument(request) {
    const body = await readDocumentBody(request);
    if (!body.ok) return json({ error: body.error }, 400);

    const response = await supabaseRequest("/rest/v1/documents", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(body.data)
    });

    return proxyResponse(response);
}

async function updateDocument(request) {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Document id is required" }, 400);

    const body = await readDocumentBody(request);
    if (!body.ok) return json({ error: body.error }, 400);

    const response = await supabaseRequest(
        `/rest/v1/documents?id=eq.${encodeURIComponent(id)}`,
        {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(body.data)
        }
    );

    return proxyResponse(response);
}

async function deleteDocument(searchParams) {
    const id = searchParams.get("id");
    if (!id) return json({ error: "Document id is required" }, 400);

    const response = await supabaseRequest(
        `/rest/v1/documents?id=eq.${encodeURIComponent(id)}`,
        { method: "DELETE" }
    );

    return proxyResponse(response);
}

async function readDocumentBody(request) {
    let input;

    try {
        input = await request.json();
    } catch {
        return { ok: false, error: "Invalid JSON body" };
    }

    const slug = String(input.slug || "").trim().toLowerCase();
    const module = String(input.module || "").trim();
    const title = String(input.title || "").trim();
    const summary = String(input.summary || "").trim();
    const content = String(input.content || "").trim();

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return { ok: false, error: "Slug must use lowercase letters, numbers, and hyphens" };
    }

    if (!module || !title || !content) {
        return { ok: false, error: "Module, title, and content are required" };
    }

    return {
        ok: true,
        data: {
            slug,
            module,
            title,
            summary,
            content,
            published: Boolean(input.published),
            updated_at: new Date().toISOString()
        }
    };
}

async function supabaseRequest(path, options = {}) {
    const baseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!baseUrl || !serviceRoleKey) {
        return new Response(JSON.stringify({ error: "Supabase server configuration is missing" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    const headers = new Headers(options.headers || {});
    headers.set("apikey", serviceRoleKey);
    headers.set("Authorization", `Bearer ${serviceRoleKey}`);
    headers.set("Content-Type", "application/json");

    try {
        return await fetch(`${baseUrl}${path}`, { ...options, headers });
    } catch {
        return new Response(JSON.stringify({ error: "Could not connect to Supabase" }), {
            status: 502,
            headers: { "Content-Type": "application/json" }
        });
    }
}

async function proxyResponse(response) {
    const text = await response.text();
    return new Response(text || "[]", {
        status: response.status,
        headers: { "Content-Type": "application/json" }
    });
}

function isAllowedAdmin(email) {
    const admins = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    return admins.includes(String(email || "").toLowerCase());
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
        if (!data || typeof data.exp !== "number" || data.exp < Date.now()) return null;
        return data;
    } catch {
        return null;
    }
}

function getCookie(request, name) {
    const cookies = (request.headers.get("cookie") || "").split(";");

    for (const cookie of cookies) {
        const separator = cookie.indexOf("=");
        if (separator === -1) continue;
        if (cookie.slice(0, separator).trim() === name) return cookie.slice(separator + 1);
    }

    return null;
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

    return [...new Uint8Array(signature)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

function timingSafeEqual(left, right) {
    if (left.length !== right.length) return false;

    let mismatch = 0;
    for (let index = 0; index < left.length; index += 1) {
        mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
    }
    return mismatch === 0;
}

function decodePayload(value) {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (padded.length % 4)) % 4;
    return JSON.parse(atob(padded + "=".repeat(padLength)));
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}