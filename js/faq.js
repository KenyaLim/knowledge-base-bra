(function () {
    const app = document.getElementById("faq-app");
    if (!app) return;
    const admin = app.dataset.admin === "true";
    const endpoint = admin ? "/api/admin/faq" : "/api/faq";
    const get = (id) => document.getElementById(`faq-${id}`);
    const status = get("status");
    const form = get("form");
    let items = [];
    let editing = null;
    let originalTags = [];
    let editGeneration = 0;
    let busy = false;
    let range = null;
    const dashboard = app.dataset.dashboard === "true";
    const pageSize = dashboard ? 5 : 20;
    let categoryValue = "Semua";
    let generation = 0;
    let timer;
    const details = new Map();
    async function detail(item) {
        if (item.answer !== undefined) return item;
        if (!details.has(item.id)) details.set(item.id, request(`${endpoint}/${item.id}`).catch((error) => { details.delete(item.id); throw error; }));
        return details.get(item.id);
    }
    async function request(url, method = "GET", body) {
        const response = await fetch(url, { method, headers: body instanceof FormData ? {} : { "Content-Type": "application/json" }, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Gagal memuat FAQ");
        return data;
    }
    function button(text, action) {
        const node = document.createElement("button");
        node.type = "button";
        node.textContent = text;
        node.addEventListener("click", action);
        return node;
    }
    function render() {
        get("list").replaceChildren();
        const query = (get("search")?.value || "").trim().toLocaleLowerCase();
        const category = get("category")?.value || categoryValue;
        const tag = get("tag")?.value || "";
        const visible = items.filter((item) => (admin || item.published !== false) && item.question.toLocaleLowerCase().includes(query) && (category === "Semua" || category === item.category) && (!tag || (item.tags || []).includes(tag))).slice(0, dashboard ? 5 : undefined);
        status.textContent = visible.length ? `${visible.length} pertanyaan${!dashboard && !admin ? " cocok dimuat" : ""}` : "Tidak ada FAQ yang ditemukan. Coba kategori atau kata kunci lain.";
        visible.forEach((item) => {
            const section = document.createElement("article");
            section.className = "faq-item";
            section.dataset.faqCategory = item.category;
            const heading = document.createElement("h2");
            const answer = document.createElement("div");
            answer.id = `answer-${item.id}`;
            answer.className = "faq-answer";
            answer.hidden = true;
            const toggle = button(item.question, async () => {
                answer.hidden = !answer.hidden;
                toggle.setAttribute("aria-expanded", String(!answer.hidden));
                section.classList.toggle("open", !answer.hidden);
                if (!answer.hidden && !answer.dataset.loaded) {
                    answer.textContent = "Memuat jawaban...";
                    try {
                        answer.innerHTML = (await detail(item)).answer;
                        answer.querySelectorAll("img").forEach((image) => { image.loading = "lazy"; image.decoding = "async"; });
                        answer.dataset.loaded = "true";
                    } catch (error) { answer.textContent = error.message; }
                }
            });
            toggle.className = "faq-question";
            toggle.id = `question-${item.id}`;
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-controls", answer.id);
            answer.setAttribute("aria-labelledby", toggle.id);
            const icon = document.createElement("i");
            icon.className = "ph ph-caret-down";
            icon.setAttribute("aria-hidden", "true");
            toggle.append(icon);
            heading.append(toggle);
            const tags = document.createElement("div");
            tags.className = "faq-tags";
            (item.tags || []).forEach((tag) => { const label = document.createElement("span"); label.textContent = tag; tags.append(label); });
            if (!admin && !dashboard) {
                const categoryLabel = document.createElement("span");
                categoryLabel.className = "faq-category-label";
                categoryLabel.textContent = item.category;
                tags.prepend(categoryLabel);
                section.append(tags, heading, answer);
            } else section.append(heading, tags, answer);
            if (admin) {
                const actions = document.createElement("div");
                actions.className = "faq-actions";
                const label = document.createElement("span");
                label.textContent = `${item.category} · ${item.published ? "Terbit" : "Draf"}`;
                actions.append(label, button("Edit", () => edit(item)), button(item.published ? "Batalkan terbit" : "Terbitkan", () => change(async () => request(`${endpoint}/${item.id}`, "PUT", { ...await detail(item), published: !item.published }))), button("Hapus", () => {
                    if (window.confirm(`Hapus FAQ “${item.question}”?`)) change(async () => {
                        await request(`${endpoint}/${item.id}`, "DELETE");
                        if (editing === item.id) close();
                    });
                }));
                ["up", "down"].forEach((direction) => {
                    const move = button(direction === "up" ? "Naik" : "Turun", () => change(() => request(`${endpoint}/reorder`, "PATCH", { id: item.id, direction })));
                    move.disabled = false;
                    actions.append(move);
                });
                section.append(actions);
            }
            get("list").append(section);
        });
    }
    async function load(append = false) {
        const current = ++generation;
        if (!append) details.clear();
        const params = new URLSearchParams({ limit: String(pageSize), offset: String(append ? items.length : 0), category: get("category")?.value || categoryValue, search: get("search")?.value || "", tag: get("tag")?.value || "" });
        if (dashboard) params.set("featured", "true");
        if (get("more")) get("more").disabled = true;
        status.textContent = "Memuat FAQ...";
        get("retry").hidden = true;
        try {
            let rows = await request(`${endpoint}?${params}`);
            if (current !== generation) return;
            if (dashboard && rows.length < pageSize) {
                params.set("featured", "false");
                params.set("limit", String(pageSize - rows.length));
                const fallback = await request(`${endpoint}?${params}`);
                if (current !== generation) return;
                rows = [...rows, ...fallback];
            }
            items = append ? [...items, ...rows] : rows;
            render();
            if (get("more")) { get("more").hidden = rows.length < pageSize; get("more").disabled = false; }
            if (admin) get("add").disabled = false;
        } catch (error) {
            if (current !== generation) return;
            if (!append) { items = []; get("list").replaceChildren(); }
            if (get("more")) get("more").hidden = true;
            if (admin) get("add").disabled = true;
            status.textContent = error.message;
            get("retry").hidden = false;
        }
    }
    async function change(action) {
        if (busy) return;
        busy = true;
        app.setAttribute("aria-busy", "true");
        status.textContent = "Menyimpan...";
        try { await action(); details.clear(); await load(); }
        catch (error) { status.textContent = error.message; }
        finally { busy = false; app.removeAttribute("aria-busy"); }
    }
    async function edit(item) {
        if (busy) return;
        const current = ++editGeneration;
        if (item && item.answer === undefined) {
            try { item = await detail(item); } catch (error) { status.textContent = error.message; return; }
        }
        if (current !== editGeneration || busy) return;
        originalTags = item?.tags || [];
        editing = item?.id || null;
        form.hidden = false;
        get("form-title").textContent = item ? "Edit FAQ" : "Tambah FAQ";
        get("question").value = item?.question || "";
        get("edit-category").value = item?.category || "Umum";
        get("published").checked = item?.published || false;
        get("featured").checked = item?.featured || false;
        get("tags").value = (item?.tags || []).join(", ");
        get("answer").innerHTML = item?.answer || "<p><br></p>";
        range = null;
        get("question").focus();
    }
    function close() { editGeneration++; form.hidden = true; editing = null; get("add").focus(); }
    function filter() { generation++; render(); if (get("more")) get("more").hidden = true; clearTimeout(timer); timer = setTimeout(() => load(), 250); }
    get("search")?.addEventListener("input", filter);
    get("category")?.addEventListener("change", filter);
    get("tag")?.addEventListener("input", filter);
    get("retry").addEventListener("click", () => load());
    get("more")?.addEventListener("click", () => load(true));
    app.querySelectorAll("[data-category]").forEach((node) => node.addEventListener("click", () => {
        clearTimeout(timer);
        categoryValue = node.dataset.category;
        app.querySelectorAll("[data-category]").forEach((other) => other.setAttribute("aria-pressed", String(other === node)));
        items = [];
        get("list").replaceChildren();
        if (get("more")) get("more").hidden = true;
        load();
    }));
    [get("tag"), get("tags")].filter(Boolean).forEach((input) => {
        let suggestionTimer;
        input.addEventListener("input", () => {
            clearTimeout(suggestionTimer);
            const prefix = input.value.split(",").at(-1).trim();
            suggestionTimer = setTimeout(async () => {
                try {
                    const tags = await request(`${endpoint}/tags?search=${encodeURIComponent(prefix)}`);
                    if (input.value.split(",").at(-1).trim() !== prefix) return;
                    get("tag-options").replaceChildren(...tags.map((tag) => { const option = document.createElement("option"); option.value = input === get("tags") ? [...input.value.split(",").slice(0, -1), tag].join(", ") : tag; return option; }));
                } catch {}
            }, 250);
        });
    });
    if (admin) {
        get("add").addEventListener("click", () => edit(null));
        get("cancel").addEventListener("click", () => { if (!busy) close(); });
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            change(async () => {
                await request(editing ? `${endpoint}/${editing}` : endpoint, editing ? "PUT" : "POST", { question: get("question").value, answer: get("answer").innerHTML, category: get("edit-category").value, published: get("published").checked, featured: get("featured").checked, tags: get("tags").value === originalTags.join(", ") ? originalTags : get("tags").value.split(",").map((tag) => tag.trim()).filter(Boolean) });
                close();
            });
        });
        document.addEventListener("selectionchange", () => {
            const selection = window.getSelection();
            if (selection.rangeCount && get("answer").contains(selection.anchorNode)) range = selection.getRangeAt(0).cloneRange();
        });
        function command(name, value) {
            get("answer").focus();
            if (range) { const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); }
            document.execCommand(name, false, value || null);
        }
        app.querySelectorAll("[data-command]").forEach((node) => node.addEventListener("click", () => command(node.dataset.command, node.dataset.value)));
        get("link").addEventListener("click", () => {
            const url = window.prompt("URL tautan (https://, http://, mailto:)");
            if (url && /^(https?:\/\/|mailto:)/i.test(url.trim())) command("createLink", url.trim());
        });
        get("answer").addEventListener("paste", (event) => {
            event.preventDefault();
            command("insertText", event.clipboardData.getData("text/plain"));
        });
        get("answer").addEventListener("drop", (event) => event.preventDefault());
        get("image-url").addEventListener("click", () => {
            const url = window.prompt("URL gambar yang sudah diupload (https:// atau http://)");
            if (url && /^https?:\/\//i.test(url.trim())) command("insertImage", url.trim());
        });
        async function compress(file) {
            if (!window.createImageBitmap || file.type === "image/gif") return file;
            let bitmap;
            try {
                bitmap = await createImageBitmap(file);
                if (bitmap.width * bitmap.height > 40000000) throw new Error("Dimensi gambar terlalu besar");
                const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(bitmap.width * scale));
                canvas.height = Math.max(1, Math.round(bitmap.height * scale));
                canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", .82));
                return blob && blob.type === "image/webp" && blob.size < file.size ? new File([blob], "faq.webp", { type: "image/webp" }) : file;
            } finally { bitmap?.close(); }
        }
        get("image").addEventListener("change", () => change(async () => {
            let file = get("image").files[0];
            if (!file) return;
            if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 15 * 1024 * 1024) throw new Error("Gambar tidak valid (maksimal 15 MB)");
            file = await compress(file);
            if (file.size > 5 * 1024 * 1024) throw new Error("Gambar FAQ maksimal 5 MB setelah kompresi");
            const data = new FormData();
            data.append("file", file);
            const result = await request("/api/cms/admin/upload", "POST", data);
            const url = new URL(result.url, location.origin);
            if (!["http:", "https:"].includes(url.protocol)) throw new Error("URL gambar tidak valid");
            command("insertImage", url.href);
            get("image").value = "";
        }));
    }
    load();
})();
