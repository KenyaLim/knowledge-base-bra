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
    let busy = false;
    let range = null;
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
        const query = get("search").value.trim().toLocaleLowerCase();
        const category = get("category").value;
        const visible = items.filter((item) => item.question.toLocaleLowerCase().includes(query) && (category === "Semua" || category === item.category));
        status.textContent = visible.length ? `${visible.length} pertanyaan` : "Tidak ada FAQ yang ditemukan.";
        visible.forEach((item) => {
            const section = document.createElement("article");
            section.className = "faq-item";
            const heading = document.createElement("h2");
            const answer = document.createElement("div");
            answer.id = `answer-${item.id}`;
            answer.className = "faq-answer";
            answer.hidden = true;
            answer.innerHTML = item.answer;
            const toggle = button(item.question, () => {
                answer.hidden = !answer.hidden;
                toggle.setAttribute("aria-expanded", String(!answer.hidden));
                section.classList.toggle("open", !answer.hidden);
            });
            toggle.className = "faq-question";
            toggle.id = `question-${item.id}`;
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-controls", answer.id);
            answer.setAttribute("aria-labelledby", toggle.id);
            const icon = document.createElement("i");
            icon.className = "ph ph-plus";
            icon.setAttribute("aria-hidden", "true");
            toggle.append(icon);
            heading.append(toggle);
            section.append(heading, answer);
            if (admin) {
                const actions = document.createElement("div");
                actions.className = "faq-actions";
                const label = document.createElement("span");
                label.textContent = `${item.category} · ${item.published ? "Terbit" : "Draf"}`;
                actions.append(label, button("Edit", () => edit(item)), button(item.published ? "Batalkan terbit" : "Terbitkan", () => change(() => request(`${endpoint}/${item.id}`, "PUT", { ...item, published: !item.published }))), button("Hapus", () => {
                    if (window.confirm(`Hapus FAQ “${item.question}”?`)) change(async () => {
                        await request(`${endpoint}/${item.id}`, "DELETE");
                        if (editing === item.id) close();
                    });
                }));
                ["up", "down"].forEach((direction) => {
                    const move = button(direction === "up" ? "Naik" : "Turun", () => change(() => request(`${endpoint}/reorder`, "PATCH", { id: item.id, direction })));
                    move.disabled = busy || items.indexOf(item) === (direction === "up" ? 0 : items.length - 1);
                    actions.append(move);
                });
                section.append(actions);
            }
            get("list").append(section);
        });
    }
    async function load() {
        status.textContent = "Memuat FAQ...";
        get("retry").hidden = true;
        try {
            items = await request(endpoint);
            render();
            if (admin) get("add").disabled = false;
        } catch (error) {
            status.textContent = error.message;
            get("retry").hidden = false;
        }
    }
    async function change(action) {
        if (busy) return;
        busy = true;
        app.setAttribute("aria-busy", "true");
        status.textContent = "Menyimpan...";
        try { await action(); await load(); }
        catch (error) { status.textContent = error.message; }
        finally { busy = false; app.removeAttribute("aria-busy"); }
    }
    function edit(item) {
        if (busy) return;
        editing = item?.id || null;
        form.hidden = false;
        get("form-title").textContent = item ? "Edit FAQ" : "Tambah FAQ";
        get("question").value = item?.question || "";
        get("edit-category").value = item?.category || "Umum";
        get("published").checked = item?.published || false;
        get("answer").innerHTML = item?.answer || "<p><br></p>";
        range = null;
        get("question").focus();
    }
    function close() { form.hidden = true; editing = null; get("add").focus(); }
    get("search").addEventListener("input", render);
    get("category").addEventListener("change", render);
    get("retry").addEventListener("click", load);
    if (admin) {
        get("add").addEventListener("click", () => edit(null));
        get("cancel").addEventListener("click", () => { if (!busy) close(); });
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            change(async () => {
                await request(editing ? `${endpoint}/${editing}` : endpoint, editing ? "PUT" : "POST", { question: get("question").value, answer: get("answer").innerHTML, category: get("edit-category").value, published: get("published").checked });
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
        get("image").addEventListener("change", () => change(async () => {
            const file = get("image").files[0];
            if (!file) return;
            if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 15 * 1024 * 1024) throw new Error("Gambar tidak valid (maksimal 15 MB)");
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
