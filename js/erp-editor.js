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

    function createSelect(labelText, options, name) {
        const label = document.createElement("label");
        label.className = "erp-editor-control";
        label.textContent = labelText;

        const select = document.createElement("select");
        select.dataset.format = name;
        options.forEach(function (option) {
            const element = document.createElement("option");
            element.value = option.value;
            element.textContent = option.label;
            select.appendChild(element);
        });
        label.appendChild(select);
        return label;
    }

    const fontControl = createSelect("Font", [
        { value: "Arial", label: "Arial" },
        { value: "Inter", label: "Inter" },
        { value: "Georgia", label: "Georgia" },
        { value: "Times New Roman", label: "Times New Roman" },
        { value: "Courier New", label: "Courier New" }
    ], "font");
    const sizeControl = createSelect("Ukuran", [
        { value: "2", label: "12 px" },
        { value: "3", label: "14 px" },
        { value: "4", label: "16 px" },
        { value: "5", label: "18 px" },
        { value: "6", label: "24 px" },
        { value: "7", label: "32 px" }
    ], "size");
    const colorControl = document.createElement("label");
    colorControl.className = "erp-editor-control erp-editor-color";
    colorControl.textContent = "Warna teks";
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = "#111111";
    colorInput.dataset.format = "color";
    colorInput.setAttribute("aria-label", "Warna teks");
    colorControl.appendChild(colorInput);

    const formattingControls = document.createElement("div");
    formattingControls.className = "erp-editor-formatting";
    formattingControls.append(fontControl, sizeControl, colorControl);
    toolbar.insertBefore(formattingControls, toolbar.firstChild);

    const alignmentGroup = document.createElement("div");
    alignmentGroup.className = "erp-editor-alignment";
    const alignmentLabel = document.createElement("span");
    alignmentLabel.className = "erp-editor-group-label";
    alignmentLabel.textContent = "Perataan";
    alignmentGroup.appendChild(alignmentLabel);

    [
        { command: "justifyLeft", label: "☰", title: "Rata kiri" },
        { command: "justifyCenter", label: "☷", title: "Rata tengah" },
        { command: "justifyRight", label: "☰", title: "Rata kanan" },
        { command: "justifyFull", label: "≋", title: "Rata penuh" }
    ].forEach(function (item) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.command = item.command;
        button.textContent = item.label;
        button.setAttribute("aria-label", item.title);
        button.title = item.title;
        alignmentGroup.appendChild(button);
    });

    [
        { command: "outdent", label: "⇤", title: "Kurangi indent" },
        { command: "indent", label: "⇥", title: "Tambah indent" }
    ].forEach(function (item) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.command = item.command;
        button.textContent = item.label;
        button.setAttribute("aria-label", item.title);
        button.title = item.title;
        alignmentGroup.appendChild(button);
    });
    alignmentGroup.setAttribute("aria-label", "Perataan teks");
    toolbar.insertBefore(alignmentGroup, imageFile.closest(".erp-editor-file"));

    const floatingToolbar = document.createElement("div");
    floatingToolbar.className = "erp-editor-floating-toolbar";
    floatingToolbar.setAttribute("role", "toolbar");
    floatingToolbar.setAttribute("aria-label", "Pemformatan pilihan teks");
    floatingToolbar.hidden = true;
    const floatingControls = document.createElement("div");
    floatingControls.className = "erp-editor-floating-controls";
    const floatingFont = createSelect("Font", [
        { value: "Arial", label: "Arial" },
        { value: "Inter", label: "Inter" },
        { value: "Georgia", label: "Georgia" },
        { value: "Times New Roman", label: "Times New Roman" },
        { value: "Courier New", label: "Courier New" }
    ], "floating-font");
    const floatingSize = createSelect("Ukuran", [
        { value: "2", label: "12 px" },
        { value: "3", label: "14 px" },
        { value: "4", label: "16 px" },
        { value: "5", label: "18 px" },
        { value: "6", label: "24 px" },
        { value: "7", label: "32 px" }
    ], "floating-size");
    floatingControls.append(floatingFont, floatingSize);
    floatingToolbar.append(floatingControls);
    [
        { command: "bold", label: "B", title: "Tebal" },
        { command: "italic", label: "I", title: "Miring" },
        { command: "underline", label: "U", title: "Garis bawah" },
        { command: "strikeThrough", label: "S̶", title: "Coret" },
        { command: "justifyLeft", label: "☰", title: "Rata kiri" },
        { command: "justifyCenter", label: "☷", title: "Rata tengah" },
        { command: "justifyRight", label: "☰", title: "Rata kanan" },
        { command: "insertUnorderedList", label: "•≡", title: "Daftar berpoin" },
        { command: "insertOrderedList", label: "1.≡", title: "Daftar bernomor" }
    ].forEach(function (item) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.command = item.command;
        button.textContent = item.label;
        button.setAttribute("aria-label", item.title);
        button.title = item.title;
        floatingToolbar.appendChild(button);
    });
    const floatingColor = document.createElement("input");
    floatingColor.type = "color";
    floatingColor.value = "#111111";
    floatingColor.setAttribute("aria-label", "Warna teks");
    floatingColor.title = "Warna teks";
    floatingToolbar.appendChild(floatingColor);
    editor.appendChild(floatingToolbar);

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
        if (!selection || !selection.rangeCount || selection.isCollapsed) return;
        const range = selection.getRangeAt(0);
        if (content.contains(range.commonAncestorContainer)) savedRange = range.cloneRange();
    }

    function restoreSelection() {
        if (!savedRange || !content.contains(savedRange.commonAncestorContainer)) return false;
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(savedRange);
        return true;
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

    fontControl.querySelector("select").addEventListener("change", function (event) {
        restoreSelection();
        content.focus();
        document.execCommand("fontName", false, event.target.value);
        rememberSelection();
        saveLater();
    });

    sizeControl.querySelector("select").addEventListener("change", function (event) {
        restoreSelection();
        content.focus();
        document.execCommand("fontSize", false, event.target.value);
        rememberSelection();
        saveLater();
    });

    colorInput.addEventListener("input", function () {
        restoreSelection();
        content.focus();
        document.execCommand("foreColor", false, colorInput.value);
        rememberSelection();
        saveLater();
    });

    function applyCommand(command, value) {
        if (!restoreSelection()) return;
        content.focus({ preventScroll: true });
        document.execCommand("styleWithCSS", false, true);
        document.execCommand(command, false, value || null);
        content.focus({ preventScroll: true });
        rememberSelection();
        saveLater();
        updateFloatingToolbar();
    }

    editor.querySelectorAll("[data-command]").forEach(function (button) {
        button.addEventListener("click", function () {
            applyCommand(button.dataset.command);
        });
    });

    toolbar.addEventListener("mousedown", function (event) {
        if (event.target.closest("select, input[type='color']")) rememberSelection();
        if (event.target.closest("[data-command], [data-insert-image]")) event.preventDefault();
    });

    floatingToolbar.addEventListener("mousedown", function (event) {
        if (event.target.closest("button")) event.preventDefault();
        if (event.target.closest("select, input[type='color']")) rememberSelection();
    });

    floatingToolbar.querySelectorAll("[data-command]").forEach(function (button) {
        button.addEventListener("click", function () {
            applyCommand(button.dataset.command);
        });
    });

    floatingFont.querySelector("select").addEventListener("change", function (event) {
        if (!restoreSelection()) return;
        content.focus({ preventScroll: true });
        document.execCommand("styleWithCSS", false, true);
        document.execCommand("fontName", false, event.target.value);
        content.focus({ preventScroll: true });
        rememberSelection();
        saveLater();
        updateFloatingToolbar();
    });
    floatingSize.querySelector("select").addEventListener("change", function (event) {
        if (!restoreSelection()) return;
        content.focus({ preventScroll: true });
        document.execCommand("styleWithCSS", false, true);
        document.execCommand("fontSize", false, event.target.value);
        content.focus({ preventScroll: true });
        rememberSelection();
        saveLater();
        updateFloatingToolbar();
    });
    floatingColor.addEventListener("input", function () {
        if (!restoreSelection()) return;
        content.focus({ preventScroll: true });
        document.execCommand("styleWithCSS", false, true);
        document.execCommand("foreColor", false, floatingColor.value);
        content.focus({ preventScroll: true });
        rememberSelection();
        saveLater();
        updateFloatingToolbar();
    });

    function updateFloatingToolbar() {
        if (!isAdmin) return;
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount || selection.isCollapsed
            || !content.contains(selection.anchorNode) || !content.contains(selection.focusNode)) {
            if (!floatingToolbar.contains(document.activeElement)) floatingToolbar.hidden = true;
            return;
        }
        if (floatingToolbar.contains(document.activeElement)) return;

        savedRange = selection.getRangeAt(0).cloneRange();
        const range = selection.getRangeAt(0);
        const rects = Array.from(range.getClientRects()).filter(function (rect) {
            return rect.width || rect.height;
        });
        const rect = rects[0] || range.getBoundingClientRect();
        if (!rect.width && !rect.height) return;

        floatingToolbar.hidden = false;
        const toolbarRect = floatingToolbar.getBoundingClientRect();
        const left = Math.max(12, Math.min(
            window.scrollX + rect.left + rect.width / 2 - toolbarRect.width / 2,
            window.scrollX + window.innerWidth - toolbarRect.width - 12
        ));
        const top = rect.top >= toolbarRect.height + 10
            ? window.scrollY + rect.top - toolbarRect.height - 10
            : window.scrollY + rect.bottom + 10;
        floatingToolbar.style.left = `${left}px`;
        floatingToolbar.style.top = `${top}px`;
    }

    content.addEventListener("mouseup", updateFloatingToolbar);
    content.addEventListener("keyup", updateFloatingToolbar);
    document.addEventListener("selectionchange", updateFloatingToolbar);
    window.addEventListener("scroll", updateFloatingToolbar, true);
    window.addEventListener("resize", updateFloatingToolbar);

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
    document.addEventListener("selectionchange", function () {
        rememberSelection();
        updateFloatingToolbar();
    });
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