document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("materialForm");
    const list = document.getElementById("materialList");
    const status = document.getElementById("formStatus");
    const moduleConfigStatus = document.getElementById("moduleConfigStatus");
    const moduleEditor = document.getElementById("moduleEditor");
    const contentEditor = document.getElementById("contentEditor");
    const formFieldIds = ["materialId", "slug", "title", "module", "kind", "summary", "content", "pdfUrl", "imageUrl", "sortOrder", "published"];
    let materials = [];
    let modules = [];
    let savedSelection = null;

    loadAdminMaterials();
    loadModuleTree();
    document.getElementById("newMaterial").addEventListener("click", clearForm);
    document.getElementById("deleteMaterial").addEventListener("click", deleteMaterial);
    document.getElementById("fileUpload").addEventListener("change", uploadFile);
    document.getElementById("mediaUpload").addEventListener("change", insertUploadedMedia);
    document.getElementById("kind").addEventListener("change", syncKindFields);
    document.getElementById("addModule").addEventListener("click", addModule);
    document.getElementById("saveModuleConfig").addEventListener("click", saveModuleTree);

    document.querySelectorAll("[data-command]").forEach(function (button) {
        button.addEventListener("click", function () {
            contentEditor.focus();
            document.execCommand(button.dataset.command, false);
        });
    });
    document.querySelector("[data-block]").addEventListener("click", function () {
        contentEditor.focus();
        document.execCommand("formatBlock", false, "H2");
    });
    document.getElementById("clearFormatting").addEventListener("click", function () {
        contentEditor.focus();
        document.execCommand("removeFormat", false);
    });
    document.getElementById("insertImage").addEventListener("click", function () { chooseMedia("image"); });
    document.getElementById("insertVideo").addEventListener("click", function () { chooseMedia("video"); });
    contentEditor.addEventListener("keyup", syncContent);
    contentEditor.addEventListener("blur", syncContent);

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        syncContent();
        status.textContent = "Saving...";
        const module = document.getElementById("module").value;
        const payload = {
            slug: document.getElementById("slug").value,
            title: document.getElementById("title").value,
            module: module,
            module_id: module,
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
            status.textContent = "Saved and published to the CMS.";
            await loadAdminMaterials();
            fillForm(result);
        } catch (error) {
            status.textContent = error.message;
        }
    });

    async function loadAdminMaterials() {
        try {
            const response = await fetch("/api/cms/admin/content");
            const loadedMaterials = await response.json();
            if (!response.ok) throw new Error(loadedMaterials.error || "Load failed");
            materials = loadedMaterials;
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

    async function loadModuleTree() {
        try {
            const response = await fetch("/api/cms/modules");
            const modules = await response.json();
            if (!response.ok) throw new Error((modules && modules.error) || "Load failed");
            window.cmsModules = modules;
            renderModuleEditor(modules);
            const select = document.getElementById("module");
            select.replaceChildren();
            modules.forEach(function (module) {
                const option = document.createElement("option");
                option.value = module.slug;
                option.textContent = module.title;
                select.appendChild(option);
            });
        } catch (error) {
            moduleConfigStatus.textContent = error.message;
        }
    }

    async function saveModuleTree() {
        try {
            const payload = collectModules();
            const response = await fetch("/api/cms/admin/modules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Save failed");
            moduleConfigStatus.textContent = "Module tree saved.";
            await loadAdminMaterials();
            await loadModuleTree();
        } catch (error) {
            moduleConfigStatus.textContent = error.message;
        }
    }

    function fillForm(material) {
        document.getElementById("materialId").value = material.id || "";
        document.getElementById("slug").value = material.slug || "";
        document.getElementById("title").value = material.title || "";
        document.getElementById("module").value = material.module_id || material.module || "";
        document.getElementById("kind").value = material.kind || "detail";
        document.getElementById("summary").value = material.summary || "";
        contentEditor.innerHTML = material.content || "";
        syncContent();
        document.getElementById("pdfUrl").value = material.pdf_url || "";
        document.getElementById("imageUrl").value = material.image_url || "";
        document.getElementById("sortOrder").value = material.sort_order || 0;
        document.getElementById("published").checked = Boolean(material.published);
        document.getElementById("deleteMaterial").hidden = !material.id;
        syncKindFields();
    }

    function clearForm() {
        formFieldIds.forEach(function (id) {
            const field = document.getElementById(id);
            if (field.type === "checkbox") field.checked = false;
            else field.value = id === "sortOrder" ? "0" : "";
        });
        document.getElementById("module").value = "order";
        contentEditor.innerHTML = "";
        syncContent();
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

    function chooseMedia(kind) {
        savedSelection = saveSelection();
        const input = document.getElementById("mediaUpload");
        input.dataset.mediaKind = kind;
        input.accept = kind === "video" ? "video/mp4,video/webm" : "image/png,image/jpeg,image/webp,image/gif";
        input.click();
    }

    async function insertUploadedMedia() {
        const input = document.getElementById("mediaUpload");
        const file = input.files[0];
        if (!file) return;
        status.textContent = "Uploading media...";
        const formData = new FormData();
        formData.append("file", file);
        try {
            const response = await fetch("/api/cms/admin/upload", { method: "POST", body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Upload failed");
            restoreSelection(savedSelection);
            contentEditor.focus();
            const html = file.type.startsWith("video/")
                ? `<video controls src="${escapeAttribute(result.url)}"></video><p><br></p>`
                : `<img src="${escapeAttribute(result.url)}" alt="${escapeAttribute(file.name)}"><p><br></p>`;
            document.execCommand("insertHTML", false, html);
            syncContent();
            status.textContent = "Media inserted into the content.";
        } catch (error) {
            status.textContent = error.message;
        } finally {
            input.value = "";
        }
    }

    function renderModuleEditor(value) {
        modules = value || [];
        moduleEditor.replaceChildren();
        modules.forEach(function (module, moduleIndex) {
            const card = document.createElement("div");
            card.className = "module-editor-card";
            card.dataset.moduleIndex = moduleIndex;
            card.innerHTML = `<div class="module-editor-heading"><strong>Module ${moduleIndex + 1}</strong><button type="button" class="cms-icon-button remove-module" title="Remove module"><i class="ph ph-trash"></i></button></div><div class="module-editor-fields"><label>Name<input data-field="title" value="${escapeAttribute(module.title || "")}"></label><label>Slug<input data-field="slug" value="${escapeAttribute(module.slug || "")}"></label><label>Phosphor icon<input data-field="icon" value="${escapeAttribute(module.icon || "ph-files")}"></label><label>Order<input data-field="sort_order" type="number" value="${Number(module.sort_order) || moduleIndex}"></label></div><div class="module-children"></div><button type="button" class="cms-secondary-button add-child"><i class="ph ph-plus"></i> Add page</button>`;
            const children = card.querySelector(".module-children");
            (module.children || []).forEach(function (child, childIndex) { appendChildEditor(children, child, childIndex); });
            moduleEditor.appendChild(card);
        });
        moduleEditor.querySelectorAll(".remove-module").forEach(function (button) {
            button.addEventListener("click", function () { button.closest(".module-editor-card").remove(); });
        });
        moduleEditor.querySelectorAll(".add-child").forEach(function (button) {
            button.addEventListener("click", function () { appendChildEditor(button.previousElementSibling, {}, button.previousElementSibling.children.length); });
        });
        moduleEditor.querySelectorAll(".remove-child").forEach(function (button) { button.addEventListener("click", function () { button.closest(".module-child").remove(); }); });
    }

    function appendChildEditor(container, child, index) {
        const row = document.createElement("div");
        row.className = "module-child";
        row.innerHTML = `<input data-field="title" placeholder="Page title" value="${escapeAttribute(child.title || "")}"><input data-field="slug" placeholder="page-slug" value="${escapeAttribute(child.slug || child.page || "")}"><button type="button" class="cms-secondary-button edit-child">Edit content</button><button type="button" class="cms-icon-button remove-child" title="Remove page"><i class="ph ph-x"></i></button>`;
        container.appendChild(row);
        row.querySelector(".edit-child").addEventListener("click", function () {
            const slug = row.querySelector('[data-field="slug"]').value.trim();
            const material = materials.find(function (item) { return item.slug === slug; });
            if (material) fillForm(material);
            else status.textContent = "Save the module tree first to create this page, then edit its content here.";
        });
        row.querySelector(".remove-child").addEventListener("click", function () { row.remove(); });
    }

    function collectModules() {
        return Array.from(moduleEditor.children).map(function (card, moduleIndex) {
            return {
                title: card.querySelector('[data-field="title"]').value,
                slug: card.querySelector('[data-field="slug"]').value,
                icon: card.querySelector('[data-field="icon"]').value,
                sort_order: card.querySelector('[data-field="sort_order"]').value,
                children: Array.from(card.querySelectorAll(".module-child")).map(function (row, childIndex) {
                    return { title: row.querySelector('[data-field="title"]').value, slug: row.querySelector('[data-field="slug"]').value, sort_order: childIndex };
                })
            };
        });
    }

    function addModule() {
        const next = collectModules();
        next.push({ title: "New module", slug: "new-module", icon: "ph-files", sort_order: next.length, children: [] });
        renderModuleEditor(next);
    }

    function syncContent() { document.getElementById("content").value = contentEditor.innerHTML; }
    function saveSelection() { const selection = window.getSelection(); return selection.rangeCount ? selection.getRangeAt(0) : null; }
    function restoreSelection(range) { if (!range) return; const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); }
    function escapeAttribute(value) { return String(value).replace(/[&<>"']/g, function (character) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]; }); }

    function syncKindFields() {
        const overview = document.getElementById("kind").value === "overview";
        document.getElementById("imageUrl").disabled = overview;
        if (overview) document.getElementById("imageUrl").value = "";
    }
});