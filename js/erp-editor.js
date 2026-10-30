(function () {
    const editor = document.querySelector("[data-erp-editor]");
    if (!editor) return;

    const content = editor.querySelector("[contenteditable]");
    if (!content) return;
    const htmlBaseline = content.innerHTML;
    const documentBlock = editor.querySelector(".doc-block");
    const imageFile = editor.querySelector("[data-image-file]");
    const imageUrl = editor.querySelector("[data-image-url]");
    let status = editor.querySelector("[data-editor-status]");
    if (!status) {
        status = document.createElement("p");
        status.setAttribute("role", "status");
        editor.appendChild(status);
    }
    const toolbar = editor.querySelector(".erp-editor-toolbar");
    if (!toolbar) { content.contentEditable = "false"; return; }
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

    const metadataFooter = document.createElement("footer");
    metadataFooter.className = "cms-material-footer erp-material-footer";
    metadataFooter.hidden = true;
    metadataFooter.innerHTML = '<i class="ph ph-clock-counter-clockwise" aria-hidden="true"></i><span></span>';
    editor.after(metadataFooter);

    const outline = document.createElement("nav");
    outline.className = "editor-outline";
    outline.setAttribute("aria-label", "Daftar heading dokumentasi");
    outline.innerHTML = "<strong>Daftar isi</strong><ul></ul>";
    if (documentBlock) documentBlock.before(outline);

    content.contentEditable = "false";
    toolbar.hidden = true;

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "Simpan ke Supabase";
    toolbar.appendChild(saveButton);

    const underlineButton = document.createElement("button");
    underlineButton.type = "button";
    underlineButton.dataset.command = "underline";
    underlineButton.innerHTML = "<u>U</u>";
    underlineButton.setAttribute("aria-label", "Garis bawah");
    underlineButton.title = "Garis bawah";
    toolbar.insertBefore(underlineButton, toolbar.querySelector("[data-insert-image]"));

    const headingButton = document.createElement("button");
    headingButton.type = "button";
    headingButton.dataset.command = "heading";
    headingButton.textContent = "Heading";
    headingButton.setAttribute("aria-label", "Jadikan heading");
    headingButton.title = "Jadikan heading untuk outline";
    toolbar.insertBefore(headingButton, underlineButton);

    function setEditorAccess(enabled) {
        isAdmin = enabled;
        content.contentEditable = enabled ? "true" : "false";
        toolbar.hidden = !enabled;
        toolbar.classList.toggle("erp-editor-toolbar-sticky", enabled);
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
            if (material && material.content) {
                content.innerHTML = material.content;
                normalizeContent();
            }
            updateMetadataFooter(material);
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

    function updateMetadataFooter(material) {
        const editedAt = material?.last_edited_at || material?.updated_at;
        const editedBy = String(material?.last_edited_by || "").trim();
        const date = editedAt ? new Date(editedAt) : null;
        if (!editedBy || !date || Number.isNaN(date.getTime())) {
            metadataFooter.hidden = true;
            return;
        }
        metadataFooter.querySelector("span").textContent = `Last edited by ${editedBy} - ${date.toLocaleString("id-ID", {
            dateStyle: "long",
            timeStyle: "short"
        })}`;
        metadataFooter.hidden = false;
    }

    async function save() {
        if (!isAdmin) return;
        normalizeContent();
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
        updateMetadataFooter(result);
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


    async function uploadImage(file) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/cms/admin/upload", { method: "POST", body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Gagal upload gambar");
        insertImage(result.url, file.name);
    }

    function insertImage(source, alt) {
        if (!isAdmin) return;
        const url = new URL(source, location.origin);
        if (!["http:", "https:"].includes(url.protocol)) { status.textContent = "URL gambar tidak valid"; return; }
        content.focus();
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

    function applyCommand(command, value) {
        content.focus();
        document.execCommand("styleWithCSS", false, false);
        document.execCommand(command, false, value || null);
        normalizeContent();
        saveLater();
    }

    function getSelectedBlock() {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount || !content.contains(selection.anchorNode)) return null;
        const node = selection.anchorNode;
        const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        return element?.closest("p, div, h1, h2, h3, h4, h5, h6, li")
            || (element === content ? content.querySelector("p, div, h1, h2, h3, h4, h5, h6, li") : null);
    }

    function toggleHeading() {
        wrapOrphanTextNodes();
        const block = getSelectedBlock();
        if (!block || block === content) return;
        const isHeading = block.classList.contains("editor-heading");
        if (isHeading) {
            block.querySelectorAll("strong, b").forEach(function (element) {
                const parent = element.parentNode;
                while (element.firstChild) parent.insertBefore(element.firstChild, element);
                parent.removeChild(element);
            });
            block.classList.remove("editor-heading");
        } else {
            const textNodes = [];
            const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
                if (node.nodeValue.trim() && !node.parentElement.closest("strong, b")) {
                    textNodes.push(node);
                }
            }
            textNodes.forEach(function (textNode) {
                const strong = document.createElement("strong");
                textNode.parentNode.insertBefore(strong, textNode);
                strong.appendChild(textNode);
            });
            block.classList.add("editor-heading");
        }
        normalizeContent();
        saveLater();
    }

    editor.querySelectorAll("[data-command]").forEach(function (button) {
        if (button.dataset.command === "heading") {
            button.addEventListener("click", toggleHeading);
            return;
        }
        if (!["bold", "italic", "underline", "insertUnorderedList", "insertOrderedList"].includes(button.dataset.command)) {
            button.hidden = true;
            return;
        }
        button.addEventListener("click", function () {
            applyCommand(button.dataset.command);
        });
    });

    toolbar.addEventListener("mousedown", function (event) {
        if (event.target.closest("[data-command], [data-insert-image], [data-insert-table]")) event.preventDefault();
    });

    function updateToolbarOffset() {
        if (!isAdmin) return;
        const navbar = document.getElementById("navbar");
        const navbarBottom = navbar ? navbar.getBoundingClientRect().bottom : 0;
        toolbar.style.setProperty("--editor-toolbar-top", `${Math.max(0, navbarBottom)}px`);
    }

    window.addEventListener("scroll", updateToolbarOffset, { passive: true });
    window.addEventListener("resize", updateToolbarOffset);


    editor.querySelector("[data-insert-table]")?.addEventListener("click", function () {
        if (!isAdmin) return;
        applyCommand("insertHTML", "<table><tbody><tr><th>Kolom 1</th><th>Kolom 2</th></tr><tr><td>Isi</td><td>Isi</td></tr></tbody></table><p><br></p>");
    });

    imageFile?.addEventListener("change", function () {
        const file = imageFile.files && imageFile.files[0];
        if (!file || !file.type.startsWith("image/")) return;
        uploadImage(file).catch(function (error) { status.textContent = error.message; });
        imageFile.value = "";
    });

    editor.querySelector("[data-insert-image]")?.addEventListener("click", function () {
        const url = imageUrl?.value.trim();
        if (!url) return;
        insertImage(url, "Screenshot dokumentasi");
        imageUrl.value = "";
    });

    function markHeadingBlocks() {
        content.querySelectorAll("p, div, h1, h2, h3, h4, h5, h6, li").forEach(function (block) {
            const text = block.textContent.replace(/\s+/g, "").trim();
            const parentBlock = block.parentElement?.closest("p, div, h1, h2, h3, h4, h5, h6, li");
            if (!text || block === content || parentBlock && parentBlock !== content
                || block.closest("li") && block !== block.closest("li")) return;
            const textNodes = [];
            const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
                if (node.nodeValue.trim()) textNodes.push(node);
            }
            const isBold = textNodes.length > 0 && textNodes.every(function (textNode) {
                return Boolean(textNode.parentElement.closest("strong, b"));
            });
            block.classList.toggle("editor-heading", isBold);
        });
    }

    function renderOutline() {
        const list = outline.querySelector("ul");
        list.innerHTML = "";
        content.querySelectorAll(".editor-heading").forEach(function (heading, index) {
            const id = `editor-heading-${index + 1}`;
            heading.id = id;
            heading.tabIndex = -1;
            const item = document.createElement("li");
            const link = document.createElement("a");
            link.href = `#${id}`;
            link.textContent = heading.textContent.trim().replace(/\s+/g, " ");
            link.addEventListener("click", function (event) {
                event.preventDefault();
                heading.scrollIntoView({ behavior: "smooth", block: "center" });
                heading.focus({ preventScroll: true });
            });
            item.appendChild(link);
            list.appendChild(item);
        });
        outline.hidden = list.children.length === 0;
    }

    function wrapOrphanTextNodes() {
        Array.from(content.childNodes).forEach(function (node) {
            if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue.trim()) return;
            const paragraph = document.createElement("p");
            content.insertBefore(paragraph, node);
            paragraph.appendChild(node);
        });
    }

    function wrapOrphanInlineNodes() {
        const blockTags = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "UL", "OL", "PRE", "BLOCKQUOTE", "TABLE", "IMG", "HR"]);
        Array.from(content.childNodes).forEach(function (node) {
            if (node.nodeType !== Node.ELEMENT_NODE || blockTags.has(node.tagName)) return;
            const paragraph = document.createElement("p");
            content.insertBefore(paragraph, node);
            paragraph.appendChild(node);
        });
    }

    function normalizeContent() {
        content.querySelectorAll("span[style]").forEach(function (element) {
            const style = element.style;
            const tagName = style.fontWeight === "bold" || Number(style.fontWeight) >= 600
                ? "strong"
                : style.fontStyle === "italic"
                    ? "em"
                    : style.textDecoration.includes("underline")
                        ? "u"
                        : null;
            if (!tagName) {
                element.removeAttribute("style");
                return;
            }
            const replacement = document.createElement(tagName);
            while (element.firstChild) replacement.appendChild(element.firstChild);
            element.replaceWith(replacement);
        });
        content.querySelectorAll("[style]").forEach(function (element) {
            element.removeAttribute("style");
        });
        content.querySelectorAll("[class]").forEach(function (element) {
            if (!element.classList.contains("erp-editor-image")
                && !element.classList.contains("editor-heading")) {
                element.removeAttribute("class");
            }
        });
        content.querySelectorAll("font, span").forEach(function (element) {
            const parent = element.parentNode;
            while (element.firstChild) parent.insertBefore(element.firstChild, element);
            parent.removeChild(element);
        });
        wrapOrphanTextNodes();
        wrapOrphanInlineNodes();
        markHeadingBlocks();
        renderOutline();
    }

    content.addEventListener("input", function () {
        normalizeContent();
        saveLater();
    });
    content.addEventListener("paste", function (event) {
        const image = Array.from(event.clipboardData.files || []).find(function (file) {
            return file.type.startsWith("image/");
        });
        event.preventDefault();
        if (!image) {
            const text = event.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
            normalizeContent();
            saveLater();
            return;
        }
        uploadImage(image).catch(function (error) { status.textContent = error.message; });
    });

    saveButton.addEventListener("click", function () {
        save().catch(function (error) { status.textContent = `Gagal menyimpan: ${error.message}`; });
    });

    editor.querySelector("[data-reset-editor]")?.addEventListener("click", async function () {
        if (!isAdmin || !window.confirm("Reset ke isi HTML bawaan modul dan hapus versi Supabase?")) return;
        clearTimeout(saveTimer);
        editVersion += 1;
        status.textContent = "Mereset ke isi HTML...";
        try {
            const response = await fetch(`/api/cms/admin/content?slug=${encodeURIComponent(slug)}`, {
                method: "DELETE",
                headers: { Accept: "application/json" }
            });
            const result = await response.json().catch(function () { return {}; });
            if (!response.ok) throw new Error(result.error || "Gagal menghapus versi Supabase");
            content.innerHTML = htmlBaseline;
            normalizeContent();
            status.textContent = "Kembali ke isi HTML bawaan";
        } catch (error) {
            status.textContent = `Reset gagal: ${error.message}`;
        }
    });

    load();
})();