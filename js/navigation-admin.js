document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("navigationForm");
    if (!form) return;
    const list = document.getElementById("navigationList");
    const status = document.getElementById("navigationStatus");
    const typeInput = document.getElementById("navigationType");
    const typeSelect = document.getElementById("navigationTypeSelect");
    const titleInput = document.getElementById("navigationTitle");
    const pageInput = document.getElementById("navigationPage");
    const urlInput = document.getElementById("navigationUrl");
    const parentSelect = document.getElementById("navigationParentId");
    const iconInput = document.getElementById("navigationIcon");
    const iconPreview = document.getElementById("navigationIconPreview");
    const iconPicker = document.getElementById("navigationIconPicker");
    const pageFields = document.getElementById("navigationPageFields");
    const parentField = document.getElementById("navigationParentField");
    const saveButton = document.getElementById("saveNavigation");
    let items = [];
    const phosphorIcons = ["ph-squares-four", "ph-folder", "ph-file-text", "ph-shopping-cart", "ph-money", "ph-chart-bar", "ph-receipt", "ph-box-arrow-down", "ph-package", "ph-truck", "ph-address-book", "ph-timer", "ph-arrow-square-up", "ph-scissors", "ph-factory", "ph-check-circle", "ph-users", "ph-gear", "ph-question", "ph-list", "ph-house-line", "ph-calendar", "ph-calendar-check", "ph-chart-line-up", "ph-clipboard-text", "ph-cube", "ph-database", "ph-download-simple", "ph-envelope", "ph-eye", "ph-globe", "ph-grid-four", "ph-hard-hat", "ph-identification-card", "ph-kanban", "ph-map-pin", "ph-note-pencil", "ph-plus-circle", "ph-printer", "ph-seal-check", "ph-shield-check", "ph-stack", "ph-tag", "ph-upload-simple", "ph-user-circle", "ph-wrench"];

    function escapeHtml(value) { return String(value || "").replace(/[&<>"']/g, function (character) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"}[character]; }); }
    function selectedId() { return document.getElementById("navigationId").value; }
    function setStatus(message) { status.textContent = message; }
    function setIcon(icon) { const value = icon || "ph-folder"; iconInput.value = value; iconPreview.innerHTML = `<i class="ph ${escapeHtml(value)}"></i> ${escapeHtml(value)}`; }

    function syncParentOptions() {
        const scope = document.querySelector('input[name="navigationScope"]:checked').value;
        const currentId = selectedId();
        parentSelect.innerHTML = '<option value="">No parent</option>' + items.filter(function (item) { return item.scope === scope && !item.parent_id && item.id !== currentId && !item.page; }).map(function (item) { return `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)}</option>`; }).join("");
    }

    function syncFields() {
        const isPage = typeSelect.value === "page";
        typeInput.value = typeSelect.value;
        pageFields.hidden = !isPage;
        parentField.hidden = !isPage;
        parentSelect.required = isPage;
        pageInput.required = isPage;
        urlInput.required = isPage;
        if (!isPage) { pageInput.value = ""; urlInput.value = ""; setIcon(iconInput.value || "ph-folder"); }
        document.getElementById("navigationFormHeading").textContent = selectedId() ? `Edit ${isPage ? "page" : "module"}` : `Add ${isPage ? "page" : "module"}`;
        document.getElementById("navigationSelection").textContent = isPage ? "Create a page inside an existing module." : "Create a module under STAGE or PROMAN.";
    }

    function clearForm(type) {
        form.reset();
        document.getElementById("navigationId").value = "";
        typeSelect.value = type || "category";
        document.querySelector('input[name="navigationScope"][value="stage"]').checked = true;
        document.getElementById("navigationSortOrder").value = "0";
        document.getElementById("deleteNavigation").hidden = true;
        setIcon(typeSelect.value === "page" ? "ph-file-text" : "ph-folder");
        syncParentOptions();
        syncFields();
        list.querySelectorAll(".is-selected").forEach(function (node) { node.classList.remove("is-selected"); });
    }

    function renderList() {
        function renderNode(item, depth) {
            const children = items.filter(function (entry) { return entry.parent_id === item.id; }).sort(function (a, b) { return a.sort_order - b.sort_order; });
            const position = items.filter(function (entry) { return (entry.parent_id || null) === (item.parent_id || null) && entry.scope === item.scope; }).sort(function (a, b) { return a.sort_order - b.sort_order; }).indexOf(item);
            const addPageButton = !item.page ? `<button type="button" class="cms-secondary-button" data-action="add-page" data-navigation-id="${escapeHtml(item.id)}">+ Halaman</button>` : "";
            const childList = children.length ? children.map(function (child) { return renderNode(child, depth + 1); }).join("") : "";
            return `<div class="navigation-admin-child navigation-admin-depth-${Math.min(depth, 3)}" draggable="true" data-drag-id="${escapeHtml(item.id)}"><div class="navigation-admin-item ${item.id === selectedId() ? "is-selected" : ""}" data-select-id="${escapeHtml(item.id)}"><span class="navigation-admin-label"><i class="ph ${escapeHtml(item.icon || (item.page ? "ph-file-text" : "ph-folder"))}"></i><strong>${escapeHtml(item.title)}</strong><small>${item.page ? escapeHtml(item.page) : "Module"}${item.published ? "" : " · Draft"}</small></span><span class="navigation-admin-actions">${addPageButton}<button type="button" class="cms-secondary-button" data-action="up" data-navigation-id="${escapeHtml(item.id)}" ${position === 0 ? "disabled" : ""} aria-label="Move up">↑</button><button type="button" class="cms-secondary-button" data-action="down" data-navigation-id="${escapeHtml(item.id)}" aria-label="Move down">↓</button><button type="button" class="cms-secondary-button" data-action="edit" data-navigation-id="${escapeHtml(item.id)}">Edit</button><button type="button" class="cms-danger-button" data-action="delete" data-navigation-id="${escapeHtml(item.id)}">Delete</button></span></div>${childList}</div>`;
        }
        list.innerHTML = ["stage", "proman"].map(function (scope) { const roots = items.filter(function (item) { return item.scope === scope && !item.parent_id; }).sort(function (a, b) { return a.sort_order - b.sort_order; }); return `<section class="navigation-admin-scope"><h3>${scope.toUpperCase()}</h3>${roots.length ? roots.map(function (item) { return renderNode(item, 0); }).join("") : "<p class=\"form-help\">No modules yet.</p>"}</section>`; }).join("");
        list.querySelectorAll("[data-action]").forEach(function (button) { button.addEventListener("click", function () { const item = items.find(function (entry) { return entry.id === button.dataset.navigationId; }); if (!item) return;             if (button.dataset.action === "delete") return deleteNavigation(item); if (button.dataset.action === "edit") return editNavigation(item); if (button.dataset.action === "add-page") return addPage(item); moveItem(item, button.dataset.action === "up" ? -1 : 1); }); });
        list.querySelectorAll("[data-drag-id]").forEach(bindDragEvents);
    }

    async function addPage(parent) {
        clearForm("page");
        document.querySelector(`input[name="navigationScope"][value="${parent.scope}"]`).checked = true;
        syncParentOptions();
        parentSelect.value = parent.id;
        titleInput.focus();
        setStatus(`Menambahkan halaman di module ${parent.title}.`);
    }

    async function moveItem(item, direction) {
        const siblings = items.filter(function (entry) { return (entry.parent_id || null) === (item.parent_id || null) && entry.scope === item.scope; }).sort(function (a, b) { return a.sort_order - b.sort_order; });
        const index = siblings.findIndex(function (entry) { return entry.id === item.id; });
        const target = siblings[index + direction];
        if (!target) return;
        siblings.splice(index, 1);
        siblings.splice(index + direction, 0, item);
        try {
            for (let position = 0; position < siblings.length; position += 1) {
                await saveItem({...siblings[position], sort_order: position * 100});
            }
            await loadNavigation();
        } catch (error) { setStatus(error.message); }
    }

    function editNavigation(item) {
        document.getElementById("navigationId").value = item.id;
        typeSelect.value = item.page ? "page" : "category";
        titleInput.value = item.title || "";
        document.querySelector(`input[name="navigationScope"][value="${item.scope || "stage"}"]`).checked = true;
        syncParentOptions();
        parentSelect.value = item.parent_id || "";
        pageInput.value = item.page || "";
        urlInput.value = item.url || "";
        setIcon(item.icon || (item.page ? "ph-file-text" : "ph-folder"));
        document.getElementById("navigationSortOrder").value = item.sort_order || 0;
        document.getElementById("navigationPublished").checked = Boolean(item.published);
        document.getElementById("deleteNavigation").hidden = false;
        syncFields();
        renderList();
    }

    function bindDragEvents(node) {
        node.addEventListener("dragstart", function (event) { event.dataTransfer.setData("text/plain", node.dataset.dragId); node.classList.add("is-dragging"); });
        node.addEventListener("dragend", function () { node.classList.remove("is-dragging"); });
        node.addEventListener("dragover", function (event) { event.preventDefault(); node.classList.add("drag-over"); });
        node.addEventListener("dragleave", function () { node.classList.remove("drag-over"); });
        node.addEventListener("drop", async function (event) { event.preventDefault(); node.classList.remove("drag-over"); const dragged = items.find(function (item) { return item.id === event.dataTransfer.getData("text/plain"); }); const target = items.find(function (item) { return item.id === node.dataset.dragId; }); if (!dragged || !target || dragged.id === target.id || (dragged.parent_id || null) !== (target.parent_id || null)) return; const siblings = items.filter(function (item) { return (item.parent_id || null) === (target.parent_id || null); }).sort(function (a, b) { return a.sort_order - b.sort_order; }); siblings.splice(siblings.indexOf(dragged), 1); siblings.splice(siblings.indexOf(target), 0, dragged); setStatus("Saving order..."); try { for (let index = 0; index < siblings.length; index += 1) await saveItem({...siblings[index], sort_order: index * 100}); await loadNavigation(); setStatus("Order saved."); } catch (error) { setStatus(`Could not save order: ${error.message}`); } });
    }

    async function saveItem(payload) { const response = await fetch("/api/cms/admin/navigation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Save failed"); return result; }
    async function deleteNavigation(item) { const descendants = items.filter(function (entry) { let parentId = entry.parent_id; while (parentId) { if (parentId === item.id) return true; const parent = items.find(function (candidate) { return candidate.id === parentId; }); parentId = parent ? parent.parent_id : null; } return false; }); if (!window.confirm(`Delete "${item.title}"? Only this item will be deleted. Items with child pages cannot be deleted.`)) return; setStatus("Deleting..."); try { const response = await fetch(`/api/cms/admin/navigation?id=${encodeURIComponent(item.id)}`, { method: "DELETE" }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Delete failed"); clearForm(); await loadNavigation(); setStatus("Deleted."); } catch (error) { setStatus(error.message); } }
    async function loadNavigation() { setStatus("Loading navigation..."); const response = await fetch("/api/cms/admin/navigation", { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Navigation load failed"); items = result.items || []; syncParentOptions(); renderList(); setStatus(""); }

    form.addEventListener("submit", async function (event) { event.preventDefault(); const isPage = typeSelect.value === "page"; const pageKey = pageInput.value.trim() || titleInput.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); if (isPage && !parentSelect.value) return setStatus("A page must have a parent module."); if (isPage && !pageKey) return setStatus("Page key is required."); const editing = items.find(function (item) { return item.id === selectedId(); }); if (editing && !window.confirm(`Save changes to "${editing.title}"?`)) return; saveButton.disabled = true; setStatus("Saving..."); try { await saveItem({ id: selectedId() || undefined, scope: document.querySelector('input[name="navigationScope"]:checked').value, parent_id: isPage ? parentSelect.value : null, title: titleInput.value.trim(), icon: iconInput.value, page: isPage ? pageKey : null, url: isPage ? (urlInput.value.trim() || `/api/cms/page/${pageKey}`) : null, sort_order: document.getElementById("navigationSortOrder").value, published: document.getElementById("navigationPublished").checked }); clearForm(isPage ? "page" : "category"); await loadNavigation(); setStatus("Saved."); } catch (error) { setStatus(error.message); } finally { saveButton.disabled = false; } });

    iconPicker.innerHTML = phosphorIcons.map(function (icon) { return `<button type="button" class="navigation-icon-button" data-icon="${icon}" title="${icon}"><i class="ph ${icon}"></i></button>`; }).join("");
    iconPicker.addEventListener("click", function (event) { const button = event.target.closest("[data-icon]"); if (button) setIcon(button.dataset.icon); });
    typeSelect.addEventListener("change", syncFields);
    document.querySelectorAll('input[name="navigationScope"]').forEach(function (radio) { radio.addEventListener("change", syncParentOptions); });
    document.getElementById("newNavigation").addEventListener("click", function () { clearForm(typeSelect.value); });
    document.getElementById("addParentNavigation").addEventListener("click", function () { clearForm("category"); });
    document.getElementById("addPageNavigation").addEventListener("click", function () { clearForm("page"); });
    document.getElementById("deleteNavigation").addEventListener("click", function () { const item = items.find(function (entry) { return entry.id === selectedId(); }); if (item) deleteNavigation(item); });
    document.getElementById("importNavigation").addEventListener("click", async function () { const defaults = Array.isArray(window.KB_DEFAULT_NAVIGATION) ? window.KB_DEFAULT_NAVIGATION : []; if (!defaults.length || !window.confirm("Replace current navigation with the existing navbar?")) return; setStatus("Syncing..."); try { const response = await fetch("/api/cms/admin/navigation/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: defaults }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Sync failed"); await loadNavigation(); setStatus(`${(result.items || defaults).length} items synced.`); } catch (error) { setStatus(error.message); } });
    clearForm("category");
    loadNavigation().catch(function (error) { setStatus(error.message); });
});
