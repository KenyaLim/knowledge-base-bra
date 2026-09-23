document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("materialsGrid")) loadMaterials();
    if (document.getElementById("materialContent")) loadMaterial();
});

async function loadMaterials() {
    const grid = document.getElementById("materialsGrid");
    const status = document.getElementById("materialsStatus");
    try {
        const response = await fetch("/api/cms/content");
        if (!response.ok) throw new Error("Could not load materials");
        const materials = await response.json();
        grid.replaceChildren();
        if (!materials.length) {
            status.textContent = "Belum ada materi yang dipublish.";
            return;
        }
        materials.forEach(function (material) {
            const card = document.createElement("a");
            card.className = "card";
            card.href = `material.html?slug=${encodeURIComponent(material.slug)}`;
            const number = document.createElement("span");
            number.className = "card-number";
            number.textContent = material.module || "DOC";
            const title = document.createElement("h3");
            title.textContent = material.title;
            const summary = document.createElement("p");
            summary.textContent = material.summary;
            const link = document.createElement("span");
            link.className = "card-link";
            link.textContent = material.pdf_url ? "Read PDF" : "Read material";
            card.append(number, title, summary, link);
            grid.appendChild(card);
        });
    } catch {
        status.textContent = "Materi belum dapat dimuat. Pastikan CMS sudah dikonfigurasi.";
    }
}

async function loadMaterial() {
    const status = document.getElementById("materialStatus");
    const slug = new URLSearchParams(window.location.search).get("slug");
    if (!slug) {
        status.textContent = "Material tidak ditemukan.";
        return;
    }
    try {
        const response = await fetch(`/api/cms/content?slug=${encodeURIComponent(slug)}`);
        if (!response.ok) throw new Error("Could not load material");
        const material = await response.json();
        if (!material) throw new Error("Not found");
        document.title = `${material.title} | Knowledge Base`;
        document.getElementById("materialModule").textContent = material.module || "KNOWLEDGE BASE";
        document.getElementById("materialTitle").textContent = material.title;
        document.getElementById("materialSummary").textContent = material.summary;
        renderPlainText(document.getElementById("materialContent"), material.content);
        if (material.image_url && material.kind !== "overview") {
            const imageUrl = safeUrl(material.image_url);
            if (imageUrl) {
                const image = document.createElement("img");
                image.className = "cms-material-image";
                image.src = imageUrl;
                image.alt = material.title;
                document.getElementById("materialContent").prepend(image);
            }
        }
        if (material.pdf_url) {
            const pdfUrl = safeUrl(material.pdf_url);
            if (pdfUrl) {
                document.getElementById("pdfPanel").hidden = false;
                document.getElementById("materialPdf").src = pdfUrl;
            }
        }
    } catch {
        status.textContent = "Materi tidak ditemukan atau belum dipublish.";
    }
}

function renderPlainText(container, value) {
    container.replaceChildren();
    String(value || "").split(/\n\s*\n/).filter(Boolean).forEach(function (paragraph) {
        const element = document.createElement("p");
        element.textContent = paragraph.trim();
        container.appendChild(element);
    });
}

function safeUrl(value) {
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
    } catch {
        return "";
    }
}
