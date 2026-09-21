document.addEventListener("DOMContentLoaded", async function () {
    const category = document.body.dataset.category;
    const list = document.getElementById("categoryDocuments");
    if (!category || !list) return;

    try {
        const response = await fetch(`/api/documents?category=${encodeURIComponent(category)}`);
        const documents = await response.json();
        if (!response.ok) throw new Error(documents.error || "Could not load materials");

        if (!documents.length) {
            list.innerHTML = '<p class="empty-state">Belum ada materi untuk kategori ini.</p>';
            return;
        }

        list.innerHTML = documents.map(function (document) {
            const isArticle = document.type === "article";
            const href = isArticle
                ? `../document.html?slug=${encodeURIComponent(document.slug)}`
                : document.file_url;
            const target = isArticle ? "" : ' target="_blank" rel="noopener"';
            const icon = typeIcon(document.type);

            return `
                <a class="material-card" href="${escapeAttribute(href || "#")}"${target}>
                    <span class="material-icon"><i class="ph ${icon}"></i></span>
                    <span class="material-info">
                        <strong>${escapeHtml(document.title)}</strong>
                        <small>${escapeHtml(document.summary || document.file_name || document.type)}${document.file_name ? ` · ${escapeHtml(document.file_name)}` : ""}</small>
                    </span>
                    <i class="ph ph-arrow-up-right material-arrow"></i>
                </a>
            `;
        }).join("");
    } catch (error) {
        list.innerHTML = `<p class="empty-state error-text">${escapeHtml(error.message)}</p>`;
    }
});

function typeIcon(type) {
    return {
        article: "ph-article",
        pdf: "ph-file-pdf",
        image: "ph-image",
        video: "ph-video-camera"
    }[type] || "ph-file";
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
}