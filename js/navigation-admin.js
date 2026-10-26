document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("navigationForm");
    if (!form) return;
    const list = document.getElementById("navigationList");
    const status = document.getElementById("navigationStatus");
    const iconInput = document.getElementById("navigationIcon");
    const iconPreview = document.getElementById("navigationIconPreview");
    const iconPicker = document.getElementById("navigationIconPicker");
    let items = [];
    const phosphorIcons = ["ph-squares-four", "ph-folder", "ph-file-text", "ph-shopping-cart", "ph-money", "ph-chart-bar", "ph-receipt", "ph-box-arrow-down", "ph-package", "ph-truck", "ph-address-book", "ph-timer", "ph-arrow-square-up", "ph-scissors", "ph-factory", "ph-check-circle", "ph-users", "ph-gear", "ph-question", "ph-list", "ph-house-line"];

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

    function setIcon(icon) {
        const value = icon || "ph-folder";
        iconInput.value = value;
        iconPreview.innerHTML = `<i class="ph ${escapeHtml(value)}"></i> ${escapeHtml(value)}`;
    }

    iconPicker.innerHTML = phosphorIcons.map(function (icon) {
        return `<button type="button" class="navigation-icon-button" data-icon="${icon}" title="${icon}"><i class="ph ${icon}"></i></button>`;
    }).join("");
    iconPicker.addEventListener("click", function (event) {
        const button = event.target.closest("[data-icon]");
        if (button) setIcon(button.dataset.icon);
    });

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, function (character) {
            return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"}[character];
        });
    }

    function clearForm() {
        form.reset();
        document.getElementById("navigationId").value = "";
        document.getElementById("navigationType").value = "category";
        setIcon("ph-folder");
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
            return `<div class="navigation-admin-child navigation-admin-depth-${Math.min(depth, 3)}" draggable="true" data-drag-id="${item.id}">
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
                setIcon(item.icon || "ph-folder");
                document.getElementById("navigationPage").value = item.page;
                document.getElementById("navigationUrl").value = item.url;
                document.getElementById("navigationSortOrder").value = item.sort_order;
                document.getElementById("navigationPublished").checked = item.published;
                document.getElementById("deleteNavigation").hidden = false;
            });
        });
        list.querySelectorAll("[data-drag-id]").forEach(function (node) {
            node.addEventListener("dragstart", function (event) { event.dataTransfer.setData("text/plain", node.dataset.dragId); node.classList.add("is-dragging"); });
            node.addEventListener("dragend", function () { node.classList.remove("is-dragging"); });
            node.addEventListener("dragover", function (event) { event.preventDefault(); node.classList.add("drag-over"); });
            node.addEventListener("dragleave", function () { node.classList.remove("drag-over"); });
            node.addEventListener("drop", async function (event) {
                event.preventDefault();
                node.classList.remove("drag-over");
                const dragged = items.find(function (entry) { return entry.id === event.dataTransfer.getData("text/plain"); });
                const target = items.find(function (entry) { return entry.id === node.dataset.dragId; });
                if (!dragged || !target || dragged.id === target.id || dragged.parent_id !== target.parent_id) return;
                const siblings = items.filter(function (entry) { return (entry.parent_id || null) === (target.parent_id || null); });
                const from = siblings.indexOf(dragged);
                const to = siblings.indexOf(target);
                siblings.splice(from, 1);
                siblings.splice(to, 0, dragged);
                status.textContent = "Menyimpan urutan...";
                try {
                    for (let index = 0; index < siblings.length; index += 1) {
                        await fetch("/api/cms/admin/navigation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...siblings[index], sort_order: index * 100 }) });
                    }
                    await loadNavigation();
                    status.textContent = "Urutan disimpan.";
                } catch (error) { status.textContent = `Gagal menyimpan urutan: ${error.message}`; }
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
                scope: document.querySelector('input[name="navigationScope"]:checked').value,
                parent_id: parentId || null,
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
