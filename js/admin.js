document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("materialForm");
    const list = document.getElementById("materialList");
    const status = document.getElementById("formStatus");
    const navigationList = document.getElementById("navigationList");
    const navigationStatus = document.getElementById("navigationStatus");
    const fields = ["materialId", "slug", "title", "module", "kind", "summary", "content", "pdfUrl", "imageUrl", "sortOrder", "published"];

    loadAdminMaterials();
    renderNavigationEditor();
    document.querySelectorAll("[data-editor-command]").forEach(function (button) {
        button.addEventListener("click", function () {
            editContent(button.dataset.editorCommand);
        });
    });
    document.getElementById("addNavigationParent").addEventListener("click", addParent);
    document.getElementById("resetNavigation").addEventListener("click", resetNavigation);
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

    function getNavigation() {
        return window.KBNavigation ? window.KBNavigation.get() : [];
    }

    function saveNavigation(navigation) {
        if (!window.KBNavigation) return;
        window.KBNavigation.save(navigation);
    }

    function navigationButton(label, action, parentId, childId) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cms-secondary-button";
        button.textContent = label;
        button.addEventListener("click", function () {
            editNavigation(action, parentId, childId);
        });
        return button;
    }

    function renderNavigationEditor() {
        if (!navigationList) return;
        navigationList.replaceChildren();
        getNavigation().forEach(function (parent) {
            const parentItem = document.createElement("div");
            parentItem.className = "cms-material-item";
            const parentTitle = document.createElement("strong");
            parentTitle.textContent = parent.title;
            parentItem.appendChild(parentTitle);
            parentItem.appendChild(navigationButton("Rename", "rename-parent", parent.id));
            parentItem.appendChild(navigationButton("Add child", "add-child", parent.id));
            parentItem.appendChild(navigationButton("Delete", "delete-parent", parent.id));

            (parent.children || []).forEach(function (child) {
                const childItem = document.createElement("div");
                childItem.className = "cms-material-item";
                childItem.style.marginTop = "8px";
                childItem.style.marginLeft = "16px";
                childItem.textContent = child.title;
                childItem.appendChild(navigationButton("Rename", "rename-child", parent.id, child.id));
                childItem.appendChild(navigationButton("Delete", "delete-child", parent.id, child.id));
                parentItem.appendChild(childItem);
            });
            navigationList.appendChild(parentItem);
        });
    }

    function askNavigationValue(message, initial) {
        const value = window.prompt(message, initial || "");
        return value ? value.trim() : "";
    }

    function editNavigation(action, parentId, childId) {
        const navigation = getNavigation();
        const parent = navigation.find(function (item) { return item.id === parentId; });
        if (!parent) return;

        if (action === "rename-parent") {
            const title = askNavigationValue("Nama parent baru:", parent.title);
            if (!title) return;
            parent.title = title;
        } else if (action === "add-child") {
            const title = askNavigationValue("Nama child baru:");
            const url = askNavigationValue("URL halaman child:", "index.html");
            if (!title || !url) return;
            parent.children.push({ id: makeNavigationId("child"), title: title, page: makeNavigationId("page"), url: url });
        } else if (action === "delete-parent") {
            if (navigation.length === 1) {
                navigationStatus.textContent = "Minimal satu parent harus tersedia.";
                return;
            }
            if (!window.confirm("Hapus parent beserta seluruh child di dalamnya?")) return;
            navigation.splice(navigation.indexOf(parent), 1);
        } else if (action === "rename-child") {
            const child = parent.children.find(function (item) { return item.id === childId; });
            const title = child && askNavigationValue("Nama child baru:", child.title);
            if (!child || !title) return;
            child.title = title;
        } else if (action === "delete-child") {
            if (parent.children.length === 1) {
                navigationStatus.textContent = "Minimal satu child harus tersedia di setiap parent.";
                return;
            }
            if (!window.confirm("Hapus child ini?")) return;
            parent.children = parent.children.filter(function (item) { return item.id !== childId; });
        }

        saveNavigation(navigation);
    }

    function addParent() {
        const title = askNavigationValue("Nama parent baru:");
        const childTitle = askNavigationValue("Nama child pertama:");
        const url = askNavigationValue("URL halaman child:", "index.html");
        if (!title || !childTitle || !url) return;
        const navigation = getNavigation();
        navigation.push({
            id: makeNavigationId("parent"),
            title: title,
            icon: "ph-folder",
            children: [{ id: makeNavigationId("child"), title: childTitle, page: makeNavigationId("page"), url: url }]
        });
        saveNavigation(navigation);
    }

    function resetNavigation() {
        if (!window.confirm("Kembalikan navigasi ke konfigurasi awal?")) return;
        window.KBNavigation.reset();
    }

    function makeNavigationId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
});
