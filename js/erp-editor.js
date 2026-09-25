(function () {
    const editor = document.querySelector("[data-erp-editor]");
    if (!editor) return;

    const content = editor.querySelector("[contenteditable]");
    const imageFile = editor.querySelector("[data-image-file]");
    const imageUrl = editor.querySelector("[data-image-url]");
    const status = editor.querySelector("[data-editor-status]");
    const toolbar = editor.querySelector(".erp-editor-toolbar");
    const slug = `erp-${document.body.dataset.page || location.pathname}`;
    let isAdmin = false;
    let saveTimer;

    content.contentEditable = "false";
    toolbar.hidden = true;

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "Simpan ke Supabase";
    toolbar.appendChild(saveButton);

    function setEditorAccess(enabled) {
        isAdmin = enabled;
        content.contentEditable = enabled ? "true" : "false";
        toolbar.hidden = !enabled;
        if (!enabled) {
            content.title = "Hanya admin yang dapat mengedit dokumentasi";
            status.textContent = "Mode baca saja";
        }
    }

    async function load() {
        try {
            const sessionResponse = await fetch("/api/session", { headers: { Accept: "application/json" } });
            const session = await sessionResponse.json();
            setEditorAccess(Boolean(session.isAdmin));
            const endpoint = session.isAdmin
                ? `/api/cms/admin/content?slug=${encodeURIComponent(slug)}`
                : `/api/cms/content?slug=${encodeURIComponent(slug)}`;
            const response = await fetch(endpoint);
            const material = await response.json();
            if (!response.ok) throw new Error(material.error || "Gagal memuat dokumentasi");
            if (material && material.content) content.innerHTML = material.content;
            status.textContent = session.isAdmin ? "Terhubung ke Supabase" : "Mode baca saja";
        } catch (error) {
            setEditorAccess(false);
            status.textContent = error.message;
        }
    }

    async function save() {
        if (!isAdmin) return;
        status.textContent = "Menyimpan ke Supabase...";
        const response = await fetch("/api/cms/admin/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                slug: slug,
                title: document.querySelector(".hero h1")?.textContent.trim() || slug,
                module: "ERP",
                module_id: slug,
                kind: "detail",
                summary: "ERP documentation",
                content: content.innerHTML,
                published: true,
                sort_order: 0
            })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Gagal menyimpan dokumentasi");
        status.textContent = "Tersimpan di Supabase";
    }

    function saveLater() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            save().catch(function (error) { status.textContent = error.message; });
        }, 800);
    }

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/cms/admin/upload", { method: "POST", body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Gagal upload gambar");
        insertImage(result.url, file.name);
    }

    function insertImage(source, alt) {
        const image = document.createElement("img");
        image.src = source;
        image.alt = alt || "Screenshot dokumentasi";
        image.className = "erp-editor-image";
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount || !content.contains(selection.anchorNode)) {
            content.appendChild(image);
        } else {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(image);
            range.setStartAfter(image);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        saveLater();
    }

    editor.querySelectorAll("[data-command]").forEach(function (button) {
        button.addEventListener("click", function () {
            content.focus();
            document.execCommand(button.dataset.command, false, null);
            saveLater();
        });
    });

    imageFile.addEventListener("change", function () {
        const file = imageFile.files && imageFile.files[0];
        if (!file || !file.type.startsWith("image/")) return;
        uploadImage(file).catch(function (error) { status.textContent = error.message; });
        imageFile.value = "";
    });

    editor.querySelector("[data-insert-image]").addEventListener("click", function () {
        const url = imageUrl.value.trim();
        if (!url) return;
        insertImage(url, "Screenshot dokumentasi");
        imageUrl.value = "";
    });

    content.addEventListener("input", saveLater);
    content.addEventListener("paste", function (event) {
        const image = Array.from(event.clipboardData.files || []).find(function (file) {
            return file.type.startsWith("image/");
        });
        if (!image) return;
        event.preventDefault();
        uploadImage(image).catch(function (error) { status.textContent = error.message; });
    });

    saveButton.addEventListener("click", function () {
        save().catch(function (error) { status.textContent = error.message; });
    });

    editor.querySelector("[data-reset-editor]").addEventListener("click", function () {
        if (!isAdmin || !window.confirm("Muat ulang isi yang tersimpan di Supabase?")) return;
        load();
    });

    load();
})();