(function () {
    const config = window.CONTENT_CONFIG || {};
    const sections = document.querySelectorAll("[data-content-list]");
    if (!sections.length) return;

    const demoMaterials = [
        {
            id: "demo-purchase-guide",
            title: "Panduan Purchasing",
            category: "Purchase",
            type: "pdf",
            file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
        },
        {
            id: "demo-flow-purchase",
            title: "Flow Purchasing",
            category: "Purchase",
            type: "image",
            file_url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80"
        }
    ];

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>'"]/g, function (character) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character];
        });
    }

    function getMaterials() {
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
            return Promise.resolve(demoMaterials);
        }

        return fetch(config.supabaseUrl.replace(/\/$/, "") + "/rest/v1/content_items?select=*&order=created_at.desc", {
            headers: {
                apikey: config.supabaseAnonKey,
                Authorization: "Bearer " + config.supabaseAnonKey
            }
        }).then(function (response) {
            if (!response.ok) throw new Error("Unable to load content");
            return response.json();
        });
    }

    function openPreview(material) {
        const modal = document.createElement("div");
        modal.className = "content-modal";
        modal.innerHTML = `
            <div class="content-modal-panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(material.title)}">
                <div class="content-modal-header">
                    <h2>${escapeHtml(material.title)}</h2>
                    <button class="content-modal-close" type="button" aria-label="Close preview"><i class="ph ph-x"></i></button>
                </div>
                ${material.type === "pdf"
                    ? `<iframe title="${escapeHtml(material.title)}" src="${escapeHtml(material.file_url)}"></iframe>`
                    : `<img alt="${escapeHtml(material.title)}" src="${escapeHtml(material.file_url)}">`}
            </div>`;
        document.body.appendChild(modal);
        const close = function () { modal.remove(); };
        modal.querySelector(".content-modal-close").addEventListener("click", close);
        modal.addEventListener("click", function (event) {
            if (event.target === modal) close();
        });
    }

    function render(materials) {
        sections.forEach(function (list) {
            const section = list.closest(".content-library");
            const category = section ? section.dataset.contentCategory : "all";
            const filtered = category === "all"
                ? materials
                : materials.filter(function (material) { return material.category === category; });
            const status = section && section.querySelector("[data-content-status]");
            if (status) status.textContent = filtered.length + " material tersedia";

            list.innerHTML = filtered.length ? filtered.map(function (material) {
                const isPdf = material.type === "pdf";
                return `<article class="content-card">
                    <i class="content-card-icon ph ${isPdf ? "ph-file-pdf" : "ph-image"}"></i>
                    <h3>${escapeHtml(material.title)}</h3>
                    <p class="content-card-meta">${escapeHtml(material.category)} · ${isPdf ? "PDF" : "Gambar"}</p>
                    <div class="content-card-actions">
                        <button class="content-action" type="button" data-preview-id="${escapeHtml(material.id)}"><i class="ph ph-eye"></i> Preview</button>
                        <a class="content-action secondary" href="${escapeHtml(material.file_url)}" target="_blank" rel="noopener"><i class="ph ph-arrow-square-out"></i> Buka</a>
                    </div>
                </article>`;
            }).join("") : `<div class="content-empty">Belum ada materi untuk modul ini.</div>`;

            list.querySelectorAll("[data-preview-id]").forEach(function (button) {
                button.addEventListener("click", function () {
                    const material = materials.find(function (item) { return item.id === button.dataset.previewId; });
                    if (material) openPreview(material);
                });
            });
        });
    }

    getMaterials().then(render).catch(function () {
        sections.forEach(function (list) {
            const status = list.closest(".content-library").querySelector("[data-content-status]");
            if (status) status.textContent = "Materi belum dapat dimuat";
            list.innerHTML = "<div class=\"content-empty\">Periksa konfigurasi Supabase atau koneksi jaringan.</div>";
        });
    });
})();