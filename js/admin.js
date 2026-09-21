document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("documentForm");
    const list = document.getElementById("documentList");
    const message = document.getElementById("adminMessage");
    const deleteButton = document.getElementById("deleteButton");
    const newButton = document.getElementById("newDocumentButton");
    const refreshButton = document.getElementById("refreshButton");
    const formHeading = document.getElementById("formHeading");
    const formStatus = document.getElementById("formStatus");
    const typeField = document.getElementById("documentType");
    const fileField = document.getElementById("documentFile");
    const contentField = document.getElementById("documentContent");
    const contentLabel = document.getElementById("contentLabel");
    let documents = [];

    function field(name) {
        return document.getElementById(`document${name}`);
    }

    function showMessage(text, type = "") {
        message.textContent = text;
        message.className = `admin-message ${type}`;
    }

    function resetForm() {
        form.reset();
        field("Id").value = "";
        formHeading.textContent = "New document";
        formStatus.textContent = "Draft";
        deleteButton.hidden = true;
        updateTypeFields();
    }

    function selectDocument(document) {
        field("Id").value = document.id;
        field("Slug").value = document.slug;
        field("Module").value = document.module;
        field("Title").value = document.title;
        field("Summary").value = document.summary || "";
        field("Content").value = document.content;
        field("Type").value = document.type || "article";
        field("FileUrl").value = document.file_url || "";
        field("Published").checked = document.published;
        formHeading.textContent = "Edit document";
        formStatus.textContent = document.published ? "Published" : "Draft";
        deleteButton.hidden = false;
        updateTypeFields();
    }

    function updateTypeFields() {
        const article = typeField.value === "article";
        contentLabel.hidden = !article;
        contentField.hidden = !article;
        contentField.required = article;
        fileField.hidden = article;
        document.getElementById("fileLabel").hidden = article;
        fileField.required = !article && !field("Id").value;
    }

    function renderList() {
        if (!documents.length) {
            list.innerHTML = '<p class="empty-state">Belum ada dokumen.</p>';
            return;
        }

        list.innerHTML = documents.map(function (document) {
            const href = document.type === "article"
                ? `/erp/document.html?slug=${encodeURIComponent(document.slug)}`
                : document.file_url;
            const viewLink = href
                ? `<a class="document-view-link" href="${escapeAttribute(href)}" target="_blank" rel="noopener">View</a>`
                : "";

            return `
                <div class="document-list-item" role="button" tabindex="0" data-id="${document.id}">
                    <span>
                        <strong>${escapeHtml(document.title)}</strong>
                        <small>${escapeHtml(document.module)} · ${escapeHtml(document.type || "article")} · ${escapeHtml(document.slug)}</small>
                    </span>
                    <span class="document-list-actions">
                        <span class="document-badge ${document.published ? "published" : "draft"}">
                            ${document.published ? "Published" : "Draft"}
                        </span>
                        ${viewLink}
                    </span>
                </div>
            `;
        }).join("");

        list.querySelectorAll("[data-id]").forEach(function (button) {
            button.addEventListener("click", function (event) {
                if (event.target.closest(".document-view-link")) return;
                const document = documents.find((item) => String(item.id) === button.dataset.id);
                if (document) selectDocument(document);
            });
        });
    }

    async function loadDocuments() {
        showMessage("Loading...");

        try {
            const response = await fetch("/api/documents");
            const data = await readJsonResponse(response);
            if (!response.ok) throw new Error(data.error || "Could not load documents");
            documents = data;
            renderList();
            showMessage(`${documents.length} document(s) loaded.`, "success");
        } catch (error) {
            showMessage(error.message, "error");
        }
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const id = field("Id").value;
        const payload = new FormData();
        payload.set("slug", field("Slug").value);
        payload.set("module", field("Module").value);
        payload.set("title", field("Title").value);
        payload.set("summary", field("Summary").value);
        payload.set("type", field("Type").value);
        payload.set("content", field("Content").value);
        payload.set("published", String(field("Published").checked));
        payload.set("file_url", field("FileUrl").value);
        if (fileField.files[0]) payload.set("file", fileField.files[0]);

        try {
            const response = await fetch(id ? `/api/documents?id=${encodeURIComponent(id)}` : "/api/documents", {
                method: id ? "PATCH" : "POST",
                body: payload
            });
            const data = await readJsonResponse(response);
            if (!response.ok) throw new Error(data.error || "Could not save document");
            showMessage("Document saved.", "success");
            await loadDocuments();
            const saved = Array.isArray(data) ? data[0] : data;
            if (saved) selectDocument(saved);
        } catch (error) {
            showMessage(error.message, "error");
        }
    });

    deleteButton.addEventListener("click", async function () {
        const id = field("Id").value;
        if (!id || !window.confirm("Delete this document?")) return;

        try {
            const response = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, { method: "DELETE" });
            const data = await readJsonResponse(response);
            if (!response.ok) throw new Error(data.error || "Could not delete document");
            resetForm();
            await loadDocuments();
            showMessage("Document deleted.", "success");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });

    newButton.addEventListener("click", resetForm);
    refreshButton.addEventListener("click", loadDocuments);
    typeField.addEventListener("change", updateTypeFields);
    updateTypeFields();
    loadDocuments();
});

async function readJsonResponse(response) {
    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch {
        throw new Error(`Server returned an invalid response (${response.status})`);
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
}