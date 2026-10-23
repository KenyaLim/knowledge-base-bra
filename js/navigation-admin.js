document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("navigationForm");
    if (!form) return;
    const list = document.getElementById("navigationList");
    const status = document.getElementById("navigationStatus");
    let items = [];

    function syncParentOptions() {
        const parentSelect = document.getElementById("navigationParentId");
        const type = document.getElementById("navigationType").value;
        parentSelect.disabled = type !== "child";
        parentSelect.innerHTML = '<option value="">Pilih parent</option>' + items
            .filter(function (item) { return !item.parent_id; })
            .map(function (item) { return `<option value="${item.id}">${escapeHtml(item.title)}</option>`; })
            .join("");
        if (type !== "child") parentSelect.value = "";
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, function (character) {
            return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"}[character];
        });
    }

    function clearForm() {
        form.reset();
        document.getElementById("navigationId").value = "";
        document.getElementById("navigationType").value = "parent";
        document.getElementById("navigationIcon").value = "ph-link";
        document.getElementById("navigationSortOrder").value = "0";
        document.getElementById("deleteNavigation").hidden = true;
        syncParentOptions();
    }

    function renderList() {
        list.innerHTML = items.length ? items.map(function (item) {
            return `<button type="button" class="cms-material-item" data-navigation-id="${item.id}">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.url)} · ${item.published ? "Published" : "Draft"}</span>
            </button>`;
        }).join("") : "<p>No navigation items yet.</p>";
        list.querySelectorAll("[data-navigation-id]").forEach(function (button) {
            button.addEventListener("click", function () {
                const item = items.find(function (entry) { return entry.id === button.dataset.navigationId; });
                if (!item) return;
                document.getElementById("navigationId").value = item.id;
                document.getElementById("navigationTitle").value = item.title;
                document.getElementById("navigationType").value = item.parent_id ? "child" : "parent";
                syncParentOptions();
                document.getElementById("navigationParentId").value = item.parent_id || "";
                document.getElementById("navigationIcon").value = item.icon;
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
                parent_id: document.getElementById("navigationType").value === "child"
                    ? document.getElementById("navigationParentId").value || null
                    : null,
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
    document.getElementById("importNavigation").addEventListener("click", async function () {
        const defaults = Array.isArray(window.KB_DEFAULT_NAVIGATION) ? window.KB_DEFAULT_NAVIGATION : [];
        if (!defaults.length || !window.confirm("Import navbar existing dari navbar.js?")) return;
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
});
