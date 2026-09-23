document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("materialForm");
    const list = document.getElementById("materialList");
    const status = document.getElementById("formStatus");
    const fields = ["materialId", "slug", "title", "module", "kind", "summary", "content", "pdfUrl", "imageUrl", "sortOrder", "published"];

    loadAdminMaterials();
    document.getElementById("newMaterial").addEventListener("click", clearForm);
    document.getElementById("deleteMaterial").addEventListener("click", deleteMaterial);
    document.getElementById("fileUpload").addEventListener("change", uploadFile);
    document.getElementById("kind").addEventListener("change", syncKindFields);
    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        status.textContent = "Saving...";
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
            status.textContent = "Saved.";
            await loadAdminMaterials();
            fillForm(result);
        } catch (error) {
            status.textContent = error.message;
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
        status.textContent = "New material.";
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
        status.textContent = "File uploaded.";
    }

    function syncKindFields() {
        const overview = document.getElementById("kind").value === "overview";
        document.getElementById("imageUrl").disabled = overview;
        if (overview) document.getElementById("imageUrl").value = "";
    }
});