document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("navigationForm");
    if (!form) return;
    const list = document.getElementById("navigationList");
    const status = document.getElementById("navigationStatus");
    let items = [];

    function syncParentOptions() {
        const parentSelect = document.getElementById("navigationParentId");
        const currentId = document.getElementById("navigationId").value;
        const byParent = function (parentId, depth) {
            return items.filter(function (item) {
                return (item.parent_id || null) === parentId && item.id !== currentId;
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
        document.getElementById("navigationIcon").value = "ph-link";
        document.getElementById("navigationSortOrder").value = "0";
        document.getElementById("deleteNavigation").hidden = true;
        syncParentOptions();
        syncFieldRequirements();
    }

    function renderList() {
        const parents = items.filter(function (item) { return !item.parent_id; });
        function renderNode(item, depth) {
            const children = items.filter(function (entry) { return entry.parent_id === item.id; });
            return `<div class="navigation-admin-child navigation-admin-depth-${Math.min(depth, 3)}">
                <span><strong>${escapeHtml(item.title)}</strong><small>${item.page ? escapeHtml(item.page) : "Kategori"}</small></span>
                <button type="button" class="cms-secondary-button" data-navigation-id="${item.id}">Edit</button>
                ${children.map(function (child) { return renderNode(child, depth + 1); }).join("")}
            </div>`;
        }
        list.innerHTML = parents.length ? parents.map(function (parent) {
            return `<section class="navigation-admin-group">
                <div class="navigation-admin-heading"><strong>${escapeHtml(parent.title)}</strong>
                    <button type="button" class="cms-secondary-button" data-navigation-id="${parent.id}">Edit</button>
                </div>
                ${items.filter(function (item) { return item.parent_id === parent.id; }).map(function (item) {
                    return renderNode(item, 1);
                }).join("") || "<p>No child links yet.</p>"}
            </section>`;
        }).join("") : "<p>No navigation items yet. Click Add to create a parent.</p>";
        list.querySelectorAll("[data-navigation-id]").forEach(function (button) {
            button.addEventListener("click", function () {
                const item = items.find(function (entry) { return entry.id === button.dataset.navigationId; });
                if (!item) return;
                document.getElementById("navigationId").value = item.id;
                document.getElementById("navigationTitle").value = item.title;
                document.getElementById("navigationType").value = item.page ? "page" : "category";
                syncParentOptions();
                document.getElementById("navigationParentId").value = item.parent_id || "";
                document.getElementById("navigationIcon").value = item.icon || "";
                document.getElementById("navigationPage").value = item.page;
                document.getElementById("navigationUrl").value = item.url;
                document.getElementById("navigationSortOrder").value = item.sort_order;
                document.getElementById("navigationPublished").checked = item.published;
                document.getElementById("deleteNavigation").hidden = false;
            });
        });
    }

    async function loadNavigation() {
        const response = await fetch("/api/cms/admin/navigation");
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Navigation load failed");
        items = result.items || [];
        syncParentOptions();
        renderList();
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        status.textContent = "Saving...";
        const response = await fetch("/api/cms/admin/navigation", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                id: document.getElementById("navigationId").value || undefined,
                parent_id: document.getElementById("navigationParentId").value || null,
                title: document.getElementById("navigationTitle").value,
                icon: document.getElementById("navigationIcon").value,
                page: document.getElementById("navigationPage").value,
                url: document.getElementById("navigationUrl").value,
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

    document.getElementById("newNavigation").addEventListener("click", clearForm);
    document.getElementById("navigationType").addEventListener("change", syncParentOptions);
    document.getElementById("navigationType").addEventListener("change", syncFieldRequirements);
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
        if (!id || !window.confirm("Delete this navigation item?")) return;
        const response = await fetch(`/api/cms/admin/navigation?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        const result = await response.json();
        if (!response.ok) {
            status.textContent = result.error || "Delete failed";
            return;
        }
        await loadNavigation();
        clearForm();
        status.textContent = "Deleted.";
    });

    loadNavigation().catch(function (error) {
        status.textContent = error.message;
    });
    syncFieldRequirements();
});
