(function () {
    const form = document.getElementById("contentForm");
    const items = document.getElementById("adminItems");
    const message = document.getElementById("formMessage");
    const cancelEdit = document.getElementById("cancelEdit");
    const idInput = document.getElementById("contentId");

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>'"]/g, function (character) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character];
        });
    }

    function request(options) {
        return fetch("../api/content", options).then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok) throw new Error(data.error || "Request failed");
                return data;
            });
        });
    }

    function loadItems() {
        request({ method: "GET" }).then(function (data) {
            window.contentItems = data.items;
            items.innerHTML = data.items.length ? data.items.map(function (item) {
                return `<article class="admin-item">
                    <div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.category)} · ${escapeHtml(item.type)}</span></div>
                    <div class="admin-item-actions">
                        <a class="content-action secondary" href="${escapeHtml(item.file_url)}" target="_blank" rel="noopener"><i class="ph ph-eye"></i></a>
                        <button class="content-action secondary" data-edit="${escapeHtml(item.id)}" type="button"><i class="ph ph-pencil-simple"></i></button>
                        <button class="content-action danger" data-delete="${escapeHtml(item.id)}" type="button"><i class="ph ph-trash"></i></button>
                    </div>
                </article>`;
            }).join("") : "<p class=\"content-empty\">Belum ada materi.</p>";
            bindActions();
        }).catch(function (error) {
            items.innerHTML = "<p class=\"content-empty\">" + escapeHtml(error.message) + "</p>";
        });
    }

    function bindActions() {
        items.querySelectorAll("[data-edit]").forEach(function (button) {
            button.addEventListener("click", function () {
                const item = window.contentItems.find(function (content) { return content.id === button.dataset.edit; });
                if (!item) return;
                idInput.value = item.id;
                document.getElementById("contentTitle").value = item.title;
                document.getElementById("contentCategory").value = item.category;
                document.getElementById("contentType").value = item.type;
                document.getElementById("formTitle").textContent = "Edit materi";
                cancelEdit.hidden = false;
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });
        items.querySelectorAll("[data-delete]").forEach(function (button) {
            button.addEventListener("click", function () {
                if (!window.confirm("Hapus materi ini?")) return;
                request({ method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: button.dataset.delete }) })
                    .then(loadItems).catch(function (error) { message.textContent = error.message; });
            });
        });
    }

    function resetForm() {
        form.reset();
        idInput.value = "";
        document.getElementById("formTitle").textContent = "Tambah materi";
        cancelEdit.hidden = true;
        message.textContent = "";
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        message.textContent = "Menyimpan...";
        request({ method: "POST", body: new FormData(form) }).then(function () {
            resetForm();
            message.textContent = "Materi tersimpan.";
            loadItems();
        }).catch(function (error) { message.textContent = error.message; });
    });
    cancelEdit.addEventListener("click", resetForm);
    document.getElementById("refreshContent").addEventListener("click", loadItems);
    loadItems();
})();