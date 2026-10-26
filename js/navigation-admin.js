document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("navigationForm");
    if (!form) return;
    const list = document.getElementById("navigationList");
    const status = document.getElementById("navigationStatus");
    let items = [];

    function syncParentOptions() {
        const parentSelect = document.getElementById("navigationParentId");
        const currentId = document.getElementById("navigationId").value;
        const scope = document.querySelector('input[name="navigationScope"]:checked').value;
        const byParent = function (parentId, depth) {
            return items.filter(function (item) {
                return item.scope === scope && (item.parent_id || null) === parentId && item.id !== currentId;
            }).flatMap(function (item) {
                return [`<option value="${item.id}">${"&nbsp;".repeat(depth * 4)}${escapeHtml(item.title)}</option>`]
                    .concat(byParent(item.id, depth + 1));
            });
        };
        parentSelect.innerHTML = '<option value="">Tidak ada (root)</option>' + byParent(null, 0).join("");
    }

    function syncFieldRequirements() {
        const page = document.getElementById("navigationType").value === "page";
        document.getElementById("navigationPage").required = page;
        document.getElementById("navigationUrl").required = page;
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, function (character) {
            return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"}[character];
        });
    }

    function clearForm() {
        form.reset();
        document.getElementById("navigationId").value = "";
        document.getElementById("navigationType").value = "category";
        document.getElementById("navigationIcon").value = "";
        document.querySelector('input[name="navigationScope"][value="stage"]').checked = true;
        document.getElementById("navigationSortOrder").value = "0";
        document.getElementById("deleteNavigation").hidden = true;
        syncParentOptions();
        syncFieldRequirements();
    }

    function renderList() {
        const scopes = ["stage", "proman"];
        function renderNode(item, depth) {
            const children = items.filter(function (entry) { return entry.parent_id === item.id; });
            return `<div class="navigation-admin-child navigation-admin-depth-${Math.min(depth, 3)}">
                <div class="navigation-admin-item">
                    <span><strong>${escapeHtml(item.title)}</strong><small>${item.page ? escapeHtml(item.page) : "Kategori"}</small></span>
                    <span class="navigation-admin-actions">
                        <button type="button" class="cms-secondary-button" data-action="edit" data-navigation-id="${item.id}">Edit</button>
                        <button type="button" class="cms-secondary-button" data-action="delete" data-navigation-id="${item.id}">Delete</button>
                    </span>
                </div>
                ${children.map(function (child) { return renderNode(child, depth + 1); }).join("")}
            </div>`;
        }
        list.innerHTML = scopes.map(function (scope) {
            const parents = items.filter(function (item) {
                return item.scope === scope && !item.parent_id;
            });
            return `<section class="navigation-admin-scope">
                <h3>${scope.toUpperCase()}</h3>
                ${parents.length ? parents.map(function (parent) {
                    return `<section class="navigation-admin-group">
                        <div class="navigation-admin-heading"><strong>${escapeHtml(parent.title)}</strong>
                            <span class="navigation-admin-actions">
                                <button type="button" class="cms-secondary-button" data-action="edit" data-navigation-id="${parent.id}">Edit</button>
                                <button type="button" class="cms-secondary-button" data-action="delete" data-navigation-id="${parent.id}">Delete</button>
                            </span>
                        </div>
                        ${items.filter(function (item) { return item.parent_id === parent.id; }).map(function (item) {
                            return renderNode(item, 1);
                        }).join("") || "<p>No child links yet.</p>"}
                    </section>`;
                }).join("") : "<p>No navigation items yet.</p>"}
            </section>`;
        }).join("");
        list.querySelectorAll("[data-navigation-id]").forEach(function (button) {
            button.addEventListener("click", function () {
                const item = items.find(function (entry) { return entry.id === button.dataset.navigationId; });
                if (!item) return;
                if (button.dataset.action === "delete") {
                    deleteNavigation(item);
                    return;
                }
                document.getElementById("navigationId").value = item.id;
                document.getElementById("navigationTitle").value = item.title;
                document.querySelector(`input[name="navigationScope"][value="${item.scope || "stage"}"]`).checked = true;
                document.getElementById("navigationType").value = item.page ? "page" : "category";
                syncParentOptions();
                document.getElementById("navigationParentId").value = item.parent_id || "";
                document.getElementById("navigationIcon").value = item.icon || "";
        document.getElementById("navigationPage").value = item.page || "";
        document.getElementById("navigationUrl").value = item.url || (item.page ? `/api/cms/page/${item.page}` : "");
        document.getElementById("navigationH1").value = item.h1 || item.title || "";
        document.getElementById("navigationSummary").value = item.summary || "";
        document.getElementById("navigationContent").value = item.content || "";
        document.getElementById("navigationSortOrder").value = item.sort_order;
                document.getElementById("navigationPublished").checked = item.published;
                document.getElementById("deleteNavigation").hidden = false;
            });
        });
    }

    async function deleteNavigation(item) {
        if (!window.confirm(`Delete "${item.title}" and its children?`)) return;
        status.textContent = "Deleting...";
        const response = await fetch(`/api/cms/admin/navigation?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
        const result = await response.json();
        if (!response.ok) {
            status.textContent = result.error || "Delete failed";
            return;
        }
        await loadNavigation();
        clearForm();
        status.textContent = "Deleted.";
    }

    async function loadNavigation() {
        status.textContent = "Loading navigation...";
        const response = await fetch("/api/cms/admin/navigation", {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(8000)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Navigation load failed");
        items = result.items || [];
        syncParentOptions();
        renderList();
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const isPage = document.getElementById("navigationType").value === "page";
        const parentId = document.getElementById("navigationParentId").value;
        if (isPage && !parentId) {
            status.textContent = "Laman HTML harus memiliki parent.";
            return;
        }
        status.textContent = "Saving...";
        const response = await fetch("/api/cms/admin/navigation", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                id: document.getElementById("navigationId").value || undefined,
                nav_key: document.getElementById("navigationPage").value
                    ? `${document.querySelector('input[name="navigationScope"]:checked').value}:${document.getElementById("navigationPage").value}`
                    : `${document.querySelector('input[name="navigationScope"]:checked').value}:category:${document.getElementById("navigationTitle").value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                scope: document.querySelector('input[name="navigationScope"]:checked').value,
                parent_id: parentId || null,
                title: document.getElementById("navigationTitle").value,
                icon: document.getElementById("navigationIcon").value,
                page: document.getElementById("navigationPage").value,
                url: document.getElementById("navigationType").value === "page"
                    ? (document.getElementById("navigationUrl").value || `/api/cms/page/${document.getElementById("navigationPage").value}`)
                    : null,
                h1: document.getElementById("navigationH1").value,
                summary: document.getElementById("navigationSummary").value,
                content: document.getElementById("navigationContent").value,
                sort_order: document.getElementById("navigationSortOrder").value,
                published: document.getElementById("navigationPublished").checked
            })
        });
        const result = await response.json();
        if (!response.ok) {
            status.textContent = result.error || "Save failed";
            return;
        }
        await loadNavigation();
        clearForm();
        status.textContent = "Saved.";
    });

    function prepareCreate(type) {
        clearForm();
        document.getElementById("navigationType").value = type;
        if (type === "page") {
            const title = document.getElementById("navigationTitle");
            title.focus();
            document.getElementById("navigationContent").value = "<h2>Overview</h2>\\n<p>Tulis isi dokumentasi di sini.</p>\\n<h2>Langkah penggunaan</h2>\\n<ol>\\n  <li>Tambahkan langkah pertama.</li>\\n  <li>Tambahkan langkah berikutnya.</li>\\n</ol>";
        }
        syncParentOptions();
        syncFieldRequirements();
    }

    document.getElementById("newNavigation").addEventListener("click", clearForm);
    document.getElementById("createRootNavigation").addEventListener("click", function () { prepareCreate("category"); });
    document.getElementById("createModuleNavigation").addEventListener("click", function () { prepareCreate("category"); });
    document.getElementById("createPageNavigation").addEventListener("click", function () { prepareCreate("page"); });
    document.getElementById("navigationType").addEventListener("change", syncParentOptions);
    document.getElementById("navigationType").addEventListener("change", syncFieldRequirements);
    document.querySelectorAll('input[name="navigationScope"]').forEach(function (radio) {
        radio.addEventListener("change", syncParentOptions);
    });
    document.getElementById("importNavigation").addEventListener("click", async function () {
        const defaults = Array.isArray(window.KB_DEFAULT_NAVIGATION) ? window.KB_DEFAULT_NAVIGATION : [];
        if (!defaults.length || !window.confirm("Replace CMS navigation with the existing navbar structure?")) return;
        status.textContent = "Importing...";
        const response = await fetch("/api/cms/admin/navigation/import", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({items: defaults})
        });
        const result = await response.json();
        if (!response.ok) {
            status.textContent = result.error || "Import failed";
            return;
        }
        await loadNavigation();
        status.textContent = `${(result.items || defaults).length} navigation items imported.`;
    });
    document.getElementById("deleteNavigation").addEventListener("click", async function () {
        const id = document.getElementById("navigationId").value;
        const item = items.find(function (entry) { return entry.id === id; });
        if (item) await deleteNavigation(item);
    });

    loadNavigation().catch(function (error) {
        status.textContent = `Navigation gagal dimuat: ${error.message}`;
    });
    syncFieldRequirements();
});
