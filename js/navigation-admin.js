document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("navigationForm");
    if (!form) return;
    const list = document.getElementById("navigationList");
    const status = document.getElementById("navigationStatus");
    const title = document.getElementById("navigationTitle");
    const parent = document.getElementById("navigationParentId");
    const id = document.getElementById("navigationId");
    const collapsed = new Set();
    let items = [];
    let busy = false;
    const scope = () => document.querySelector('[name="navigationScope"]:checked').value;
    const type = () => document.querySelector('[name="navigationType"]:checked').value;
    const escape = (value) => String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
    const wrapper = (item) => !item.page && !item.parent_id && item.title.toLowerCase() === item.scope;
    const sorted = (values) => values.slice().sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
    const modules = () => sorted(items.filter((item) => item.scope === scope() && !item.page && !wrapper(item)));

    async function request(path, method, body) {
        const response = await fetch(`/api/cms/admin/navigation${path}`, { method, headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Permintaan gagal");
        return result;
    }

    function fields() {
        const isPage = type() === "page";
        const selected = parent.value;
        parent.innerHTML = '<option value="">Pilih modul</option>' + modules().map((item) => `<option value="${escape(item.id)}">${escape(item.title)}</option>`).join("");
        parent.value = selected;
        parent.required = isPage;
        document.getElementById("navigationParentField").hidden = !isPage;
        document.getElementById("navigationTitleLabel").textContent = isPage ? "Judul halaman baru" : "Nama modul baru";
        document.getElementById("saveNavigation").textContent = id.value ? "Simpan" : "Tambah";
        document.getElementById("newNavigation").hidden = !id.value && !title.value;
    }

    function reset(mode = "module") {
        id.value = "";
        title.value = "";
        parent.value = "";
        document.querySelector(`[name="navigationType"][value="${mode}"]`).checked = true;
        fields();
    }

    function actions(item) {
        const siblings = item.page ? sorted(items.filter((entry) => entry.scope === item.scope && entry.parent_id === item.parent_id)) : modules();
        const index = siblings.findIndex((entry) => entry.id === item.id);
        return `<span class="navigation-context-actions">${[["edit", "pencil-simple", "Edit", false], ["delete", "trash", "Hapus", false], ["up", "arrow-up", "Naik", index === 0], ["down", "arrow-down", "Turun", index === siblings.length - 1]].filter((entry) => !item.page || entry[0] !== "edit").map(([action, icon, label, disabled]) => `<button type="button" data-action="${action}" data-id="${escape(item.id)}" aria-label="${label} ${escape(item.title)}" title="${label}" ${disabled ? "disabled" : ""}><i class="ph ph-${icon}" aria-hidden="true"></i></button>`).join("")}</span>`;
    }

    function pageRow(item) {
        const url = String(item.url || "");
        const safe = url && !/^(?:[a-z]+:|\/\/)/i.test(url) && !url.includes("\\");
        return `<li class="navigation-page-row"><i class="ph ph-file-text" aria-hidden="true"></i>${safe ? `<a href="${escape(url.startsWith("/") ? url : "/" + url)}">${escape(item.title)}</a>` : `<span>${escape(item.title)}</span>`}<button type="button" data-action="edit" data-id="${escape(item.id)}">Edit</button>${actions(item)}</li>`;
    }

    function render() {
        document.getElementById("navigationStructureHeading").textContent = scope().toUpperCase();
        const roots = modules();
        const direct = sorted(items.filter((item) => item.scope === scope() && item.page && items.some((entry) => entry.id === item.parent_id && wrapper(entry))));
        list.innerHTML = direct.map(pageRow).join("") + roots.map((item) => {
            const open = !collapsed.has(item.id);
            const children = sorted(items.filter((entry) => entry.parent_id === item.id && entry.page));
            return `<li class="navigation-module"><div class="navigation-module-row"><button type="button" class="navigation-toggle" data-action="toggle" data-id="${escape(item.id)}" aria-expanded="${open}" aria-controls="pages-${escape(item.id)}"><i class="ph ph-caret-${open ? "down" : "right"}" aria-hidden="true"></i><i class="ph ph-folder" aria-hidden="true"></i><span>${escape(item.title)}</span></button><button type="button" data-action="add-page" data-id="${escape(item.id)}">+ Halaman</button>${actions(item)}</div><ul class="navigation-pages" id="pages-${escape(item.id)}" ${open ? "" : "hidden"}>${children.length ? children.map(pageRow).join("") : '<li class="navigation-empty">Belum ada halaman.</li>'}</ul></li>`;
        }).join("") || '<li class="navigation-empty">Belum ada modul.</li>';
    }

    async function load() {
        const result = await request("", "GET");
        items = result.items || [];
        fields();
        render();
    }

    async function mutate(operation, message) {
        if (busy) return;
        busy = true;
        form.setAttribute("aria-busy", "true");
        document.getElementById("saveNavigation").disabled = true;
        status.textContent = "Menyimpan...";
        try {
            await operation();
            await load();
            document.dispatchEvent(new Event("kb:navigation-changed"));
            status.textContent = message;
        } catch (error) {
            status.textContent = error.message;
        } finally {
            busy = false;
            form.removeAttribute("aria-busy");
            document.getElementById("saveNavigation").disabled = false;
        }
    }

    list.addEventListener("click", function (event) {
        const button = event.target.closest("[data-action]");
        if (!button || busy) return;
        const item = items.find((entry) => entry.id === button.dataset.id);
        if (!item) return;
        const action = button.dataset.action;
        if (action === "toggle") {
            collapsed.has(item.id) ? collapsed.delete(item.id) : collapsed.add(item.id);
            render();
            list.querySelector(`[data-action="toggle"][data-id="${item.id}"]`).focus();
        } else if (action === "edit" || action === "add-page") {
            reset(action === "add-page" || item.page ? "page" : "module");
            if (action === "edit") { id.value = item.id; title.value = item.title; }
            fields();
            if (item.page && !Array.from(parent.options).some((option) => option.value === item.parent_id)) {
                const existingParent = items.find((entry) => entry.id === item.parent_id);
                if (existingParent) parent.add(new Option(existingParent.title, existingParent.id));
            }
            parent.value = action === "add-page" ? item.id : item.parent_id || "";
            form.scrollIntoView({ behavior: "smooth", block: "nearest" });
            title.focus();
        } else if (action === "delete") {
            if (window.confirm(`Hapus "${item.title}"? Modul yang masih memiliki halaman tidak dapat dihapus.`)) mutate(async () => { await request(`?id=${encodeURIComponent(item.id)}`, "DELETE"); if (id.value === item.id) reset(); }, "Item dihapus.");
        } else {
            mutate(() => request("/move", "POST", { id: item.id, direction: action === "up" ? -1 : 1 }), "Urutan disimpan.");
        }
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!title.value.trim()) return;
        const existing = items.find((item) => item.id === id.value);
        const payload = { ...(existing ? { id: existing.id } : {}), type: existing ? (existing.page ? "page" : "module") : type(), scope: scope(), title: title.value.trim(), parent_id: type() === "page" ? parent.value : existing?.parent_id || null };
        mutate(async () => { await request("", "POST", payload); reset(type()); }, "Tersimpan.");
    });
    document.querySelectorAll('[name="navigationScope"]').forEach((input) => input.addEventListener("change", () => { reset(); render(); }));
    document.querySelectorAll('[name="navigationType"]').forEach((input) => input.addEventListener("change", () => reset(input.value)));
    document.getElementById("newNavigation").addEventListener("click", () => reset(type()));
    title.addEventListener("input", () => { document.getElementById("newNavigation").hidden = !id.value && !title.value; });
    load().catch((error) => { status.textContent = error.message; });
});
