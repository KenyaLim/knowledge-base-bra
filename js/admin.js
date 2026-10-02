document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("materialForm");
    const list = document.getElementById("materialList");
    const status = document.getElementById("formStatus");
    const fields = ["materialId", "slug", "title", "module", "kind", "summary", "content", "pdfUrl", "imageUrl", "sortOrder", "published"];

    loadAdminMaterials();
    updateImagePreview();
    document.querySelectorAll("[data-editor-command]").forEach(function (button) {
        button.addEventListener("click", function () {
            editContent(button.dataset.editorCommand);
        });
    });
    document.getElementById("newMaterial").addEventListener("click", clearForm);
    document.getElementById("deleteMaterial").addEventListener("click", deleteMaterial);
    document.getElementById("fileUpload").addEventListener("change", uploadFile);
    document.getElementById("kind").addEventListener("change", syncKindFields);
    document.getElementById("imageUrl").addEventListener("input", updateImagePreview);
    form.addEventListener("input", function () {
        status.textContent = "Belum tersimpan di Supabase";
    });
    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        status.textContent = "Menyimpan ke Supabase...";
        const payload = {
            slug: document.getElementById("slug").value,
            title: document.getElementById("title").value,
            module: document.getElementById("module").value,
            module_id: document.getElementById("module").value,
            kind: document.getElementById("kind").value,
            summary: document.getElementById("summary").value,
            content: document.getElementById("content").value,
            pdf_url: document.getElementById("pdfUrl").value,
            image_url: document.getElementById("imageUrl").value,
            sort_order: document.getElementById("sortOrder").value,
            published: document.getElementById("published").checked
        };
        try {
            const response = await fetch("/api/cms/admin/content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Save failed");
            status.textContent = "Tersimpan di Supabase";
            await loadAdminMaterials();
            fillForm(result);
        } catch (error) {
            status.textContent = `Gagal menyimpan: ${error.message}`;
        }
    });

    async function loadAdminMaterials() {
        try {
            const response = await fetch("/api/cms/admin/content");
            const materials = await response.json();
            if (!response.ok) throw new Error(materials.error || "Load failed");
            list.replaceChildren();
            materials.forEach(function (material) {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "cms-material-item";
                button.textContent = `${material.title} ${material.published ? "(published)" : "(draft)"}`;
                button.addEventListener("click", function () { fillForm(material); });
                list.appendChild(button);
            });
        } catch (error) {
            list.textContent = error.message;
        }
    }

    function fillForm(material) {
        document.getElementById("materialId").value = material.id || "";
        document.getElementById("slug").value = material.slug || "";
        document.getElementById("title").value = material.title || "";
        document.getElementById("module").value = material.module || "";
        document.getElementById("kind").value = material.kind || "detail";
        document.getElementById("summary").value = material.summary || "";
        document.getElementById("content").value = material.content || "";
        document.getElementById("pdfUrl").value = material.pdf_url || "";
        document.getElementById("imageUrl").value = material.image_url || "";
        updateImagePreview();
        document.getElementById("sortOrder").value = material.sort_order || 0;
        document.getElementById("published").checked = Boolean(material.published);
        document.getElementById("deleteMaterial").hidden = !material.id;
        syncKindFields();
    }

    function clearForm() {
        fields.forEach(function (id) {
            const field = document.getElementById(id);
            if (field.type === "checkbox") field.checked = false;
            else field.value = id === "sortOrder" ? "0" : "";
        });
        status.textContent = "Materi baru belum tersimpan di Supabase";
        document.getElementById("deleteMaterial").hidden = true;
        syncKindFields();
    }

    async function deleteMaterial() {
        const id = document.getElementById("materialId").value;
        if (!id || !window.confirm("Delete this material?")) return;
        status.textContent = "Deleting...";
        const response = await fetch(`/api/cms/admin/content?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        const result = await response.json();
        if (!response.ok) {
            status.textContent = result.error || "Delete failed";
            return;
        }
        clearForm();
        await loadAdminMaterials();
        status.textContent = "Deleted.";
    }

    async function uploadFile() {
        const file = document.getElementById("fileUpload").files[0];
        if (!file) return;
        status.textContent = "Uploading...";
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/cms/admin/upload", { method: "POST", body: formData });
        const result = await response.json();
        if (!response.ok) {
            status.textContent = result.error || "Upload failed";
            return;
        }
        const field = file.type === "application/pdf" ? "pdfUrl" : "imageUrl";
        document.getElementById(field).value = result.url;
        if (field === "imageUrl") updateImagePreview();
        status.textContent = "File uploaded.";
    }

    function syncKindFields() {
        const overview = document.getElementById("kind").value === "overview";
        document.getElementById("imageUrl").disabled = overview;
        if (overview) document.getElementById("imageUrl").value = "";
        updateImagePreview();
    }

    function updateImagePreview() {
        const image = document.getElementById("imagePreview");
        const url = document.getElementById("imageUrl").value.trim();
        image.hidden = !url;
        image.src = url;
    }

    function editContent(command) {
        const content = document.getElementById("content");
        const start = content.selectionStart;
        const end = content.selectionEnd;
        const selected = content.value.slice(start, end) || "teks baru";
        let replacement = selected;

        if (["strong", "em", "u", "h2"].includes(command)) {
            replacement = `<${command}>${selected}</${command}>`;
        } else if (command === "ul") {
            replacement = `<ul>${selected.split(/\n/).map(function (line) {
                return `<li>${line || "teks baru"}</li>`;
            }).join("")}</ul>`;
        } else if (command === "link") {
            const url = window.prompt("URL tautan:", "https://");
            if (!url) return;
            replacement = `<a href="${url}" target="_blank" rel="noreferrer">${selected}</a>`;
        } else if (command === "image") {
            const url = window.prompt("URL gambar:", "https://");
            if (!url) return;
            replacement = `<img src="${url}" alt="${selected}">`;
        } else if (command === "pdf") {
            const url = window.prompt("URL PDF:", "https://");
            if (!url) return;
            replacement = `<p><a href="${url}" target="_blank" rel="noreferrer">Buka PDF</a></p><iframe src="${url}" title="PDF"></iframe>`;
        }

        content.setRangeText(replacement, start, end, "end");
        content.focus();
    }

});
