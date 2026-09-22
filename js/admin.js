document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("materialForm");
    const list = document.getElementById("materialList");
    const status = document.getElementById("formStatus");
    const fields = ["materialId", "slug", "title", "module", "summary", "content", "pdfUrl", "sortOrder", "published"];

    loadAdminMaterials();
    document.getElementById("newMaterial").addEventListener("click", clearForm);
    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        status.textContent = "Saving...";
        const payload = {
            slug: document.getElementById("slug").value,
            title: document.getElementById("title").value,
            module: document.getElementById("module").value,
            summary: document.getElementById("summary").value,
            content: document.getElementById("content").value,
            pdf_url: document.getElementById("pdfUrl").value,
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
        document.getElementById("summary").value = material.summary || "";
        document.getElementById("content").value = material.content || "";
        document.getElementById("pdfUrl").value = material.pdf_url || "";
        document.getElementById("sortOrder").value = material.sort_order || 0;
        document.getElementById("published").checked = Boolean(material.published);
    }

    function clearForm() {
        fields.forEach(function (id) {
            const field = document.getElementById(id);
            if (field.type === "checkbox") field.checked = false;
            else field.value = id === "sortOrder" ? "0" : "";
        });
        status.textContent = "New material.";
    }
});
