const allowedTypes = {
    pdf: "application/pdf",
    image: "image/"
};

export default async function handler(request) {
    const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "knowledge-content";
    if (!supabaseUrl || !serviceKey) return jsonResponse({ error: "Supabase server configuration is incomplete." }, 500);

    try {
        if (request.method === "GET") {
            const items = await supabaseRequest(`${supabaseUrl}/rest/v1/content_items?select=*&order=created_at.desc`, { method: "GET" }, serviceKey);
            return jsonResponse({ items });
        }

        if (request.method === "DELETE") {
            const { id } = await request.json();
            if (!id) return jsonResponse({ error: "Content id is required." }, 400);
            await supabaseRequest(`${supabaseUrl}/rest/v1/content_items?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }, serviceKey);
            return jsonResponse({ ok: true });
        }

        if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

        const form = await request.formData();
        const id = String(form.get("id") || "");
        const title = String(form.get("title") || "").trim();
        const category = String(form.get("category") || "");
        const type = String(form.get("type") || "");
        const file = form.get("file");
        if (!title || !category || !allowedTypes[type]) return jsonResponse({ error: "Title, category, and type are required." }, 400);
        if (!id && !(file instanceof File)) return jsonResponse({ error: "File is required for new content." }, 400);
        if (file instanceof File && !file.type.startsWith(allowedTypes[type])) return jsonResponse({ error: "File type does not match the selected content type." }, 400);

        let fileUrl;
        if (file instanceof File) {
            const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
            const path = `${Date.now()}-${safeName}`;
            const upload = await supabaseRequest(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
                method: "POST",
                headers: { "Content-Type": file.type, "x-upsert": "false" },
                body: Buffer.from(await file.arrayBuffer())
            }, serviceKey);
            fileUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
        }

        const record = { title, category, type };
        if (fileUrl) record.file_url = fileUrl;
        const endpoint = id
            ? `${supabaseUrl}/rest/v1/content_items?id=eq.${encodeURIComponent(id)}`
            : `${supabaseUrl}/rest/v1/content_items`;
        const saved = await supabaseRequest(endpoint, {
            method: id ? "PATCH" : "POST",
            headers: { "Prefer": "return=representation", "Content-Type": "application/json" },
            body: JSON.stringify(record)
        }, serviceKey);
        return jsonResponse({ item: saved[0] || saved });
    } catch (error) {
        return jsonResponse({ error: error.message || "Content request failed." }, 500);
    }
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
    });
}

async function supabaseRequest(url, options, serviceKey) {
    const headers = { ...(options.headers || {}), apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
    const result = await fetch(url, { ...options, headers });
    if (!result.ok) throw new Error(await result.text());
    if (result.status === 204) return null;
    return result.json();
}