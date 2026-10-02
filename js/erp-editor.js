(function () {
    const editor = document.querySelector("[data-erp-editor]");
    if (!editor) return;

    const content = editor.querySelector("[contenteditable]");
    const imageFile = editor.querySelector("[data-image-file]");
    const imageUrl = editor.querySelector("[data-image-url]");
    const status = editor.querySelector("[data-editor-status]");
    const toolbar = editor.querySelector(".erp-editor-toolbar");
    const moduleName = document.body.dataset.module || "ERP";
    const slug = editor.dataset.cmsSlug
        || document.body.dataset.cmsSlug
        || `erp-${document.body.dataset.page || location.pathname}`;
    const loadingScreen = document.createElement("div");
    loadingScreen.className = "erp-loading-screen";
    loadingScreen.setAttribute("role", "status");
    loadingScreen.setAttribute("aria-live", "polite");
    loadingScreen.innerHTML = '<span class="erp-loading-spinner" aria-hidden="true"></span><span>Memuat dokumentasi...</span>';
    document.body.appendChild(loadingScreen);
    let isAdmin = false;
    let saveTimer;
    let editVersion = 0;
    let savedRange = null;

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
            content.title = "Admin";
            status.textContent = "View";
        }
    }

    async function load() {
        let sessionResolved = false;
        try {
            const sessionResponse = await fetch("/api/session", { headers: { Accept: "application/json" } });
            const session = sessionResponse.ok
                ? await sessionResponse.json().catch(function () { return {}; })
                : {};
            sessionResolved = true;
            setEditorAccess(Boolean(session.isAdmin));
            const endpoint = session.isAdmin
                ? `/api/cms/admin/content?slug=${encodeURIComponent(slug)}`
                : `/api/cms/content?slug=${encodeURIComponent(slug)}`;
            const response = await fetch(endpoint);
            if (!response.ok) {
                if (!session.isAdmin) {
                    status.textContent = "Mode baca saja";
                    return;
                }
                const errorResult = await response.json().catch(function () { return {}; });
                throw new Error(errorResult.error || "Gagal memuat dokumentasi");
            }
            const material = await response.json();
            if (material && material.content) content.innerHTML = material.content;
            status.textContent = session.isAdmin
                ? (material ? "Tersimpan di Supabase" : "Belum tersimpan di Supabase")
                : "Mode baca saja";
        } catch (error) {
            if (!sessionResolved) setEditorAccess(false);
            status.textContent = isAdmin ? error.message : "Mode baca saja";
        } finally {
            document.body.classList.add("erp-editor-ready");
            loadingScreen.remove();
        }
    }

    async function save() {
        if (!isAdmin) return;
        const version = editVersion;
        status.textContent = "Menyimpan ke Supabase...";
        const response = await fetch("/api/cms/admin/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                slug: slug,
                title: document.querySelector(".hero h1")?.textContent.trim() || slug,
                module: moduleName,
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
        status.textContent = version === editVersion
            ? "Tersimpan di Supabase"
            : "Belum tersimpan di Supabase";
    }

    function saveLater() {
        editVersion += 1;
        status.textContent = "Belum tersimpan di Supabase";
        clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            save().catch(function (error) { status.textContent = error.message; });
        }, 800);
    }

    function rememberSelection() {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        if (content.contains(range.commonAncestorContainer)) savedRange = range.cloneRange();
    }

    function restoreSelection() {
        if (!savedRange || !content.contains(savedRange.commonAncestorContainer)) return;
        content.focus();
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
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
        restoreSelection();
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
            savedRange = range.cloneRange();
        }
        saveLater();
    }

    editor.querySelectorAll("[data-command]").forEach(function (button) {
        button.addEventListener("click", function () {
            restoreSelection();
            content.focus();
            document.execCommand(button.dataset.command, false, null);
            rememberSelection();
            saveLater();
        });
    });

    toolbar.addEventListener("mousedown", function (event) {
        if (event.target.closest("[data-command], [data-insert-image]")) event.preventDefault();
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
    content.addEventListener("mouseup", rememberSelection);
    content.addEventListener("keyup", rememberSelection);
    document.addEventListener("selectionchange", rememberSelection);
    content.addEventListener("paste", function (event) {
        const image = Array.from(event.clipboardData.files || []).find(function (file) {
            return file.type.startsWith("image/");
        });
        if (!image) return;
        event.preventDefault();
        uploadImage(image).catch(function (error) { status.textContent = error.message; });
    });

    saveButton.addEventListener("click", function () {
        save().catch(function (error) { status.textContent = `Gagal menyimpan: ${error.message}`; });
    });

    editor.querySelector("[data-reset-editor]").addEventListener("click", function () {
        if (!isAdmin || !window.confirm("Muat ulang isi yang tersimpan di Supabase?")) return;
        load();
    });

    load();
})();