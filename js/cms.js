document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("materialsGrid")) loadMaterials();
    if (document.getElementById("materialContent")) loadMaterial();
});

const localMaterials = {
    "stage-address": {
        title: "Address",
        module: "STAGE",
        summary: "Referensi company, buyer, dan supplier yang digunakan oleh modul transaksi.",
        content: "<h2>Referensi Master</h2><p>Address Module menjadi sumber Company dan Buyer pada quotation Costing. Data Buyer dan Supplier juga menjadi referensi saat menyiapkan Purchase.</p><h2>Penggunaan Data</h2><p>Pastikan record pihak terkait sudah tersedia dan dipilih dengan benar sebelum membuat quotation atau purchase order. Detail field dan prosedur pemeliharaan Address tidak dijelaskan dalam rangkuman sumber yang tersedia.</p>"
    },
    "proman-overview": {
        title: "PROMAN Production Management",
        module: "PROMAN",
        summary: "Alur produksi garment dari master data dan time study hingga finishing dan laporan.",
        content: "<h2>Alur Utama</h2><p>Masters → Time Study → Production Planning → Fabric/Trims Inward &amp; QC → Cutting → Production → Quality Control → Garment Issue → Finishing → Reports. PROMAN dapat terintegrasi dengan STAGE untuk replikasi data antar unit dan Head Office.</p><h2>Security dan Masters</h2><p>Security mengatur user, password, privilege, akses unit/line/warehouse, freeze date, reports, barcode, serta parameter modul. Masters menyiapkan machine type, line, grade, operation, employee operation, garment-wise operation/SMV, defect, period, incentive, power consumption, dan target bulanan.</p><h2>Time Study dan Planning</h2><p>Time Study menentukan urutan operasi, SMV, flow chart, kebutuhan mesin/manpower, dan approval. Production Planning mengatur Work Order, line, tanggal mulai/selesai, target, dan quantity. Kapasitas dipengaruhi jumlah mesin, efisiensi line, jam kerja, dan sampling time.</p><h2>Inward, QC, dan Cutting</h2><p>Fabric/Trims Inward mencatat material masuk. Fabric QC mengecek quantity, roll, shade, width, defect, dan actual quantity; hanya roll Confirmed yang dapat dikirim ke Cutting. Cutting menghasilkan pieces, bundles, dan sticker untuk line, dengan konfigurasi size, shade, color, roll, dan ratio.</p><h2>Production dan Barcode</h2><p>Production mencatat output secara hourly atau daily. Bundle tracking, shift, vendor production, plan number, piece rate, color validation, dan quantity validation tersedia sesuai parameter. Barcode mendukung identifikasi employee, bundle, production, QC, dan garment issue.</p><h2>QC, Garment Issue, dan Finishing</h2><p>Quality Control memvalidasi cut quantity, color, size, process, dan Work Order. Garment Issue memindahkan garment antar proses; acknowledgement atau receipt dapat diwajibkan. Finishing menjadi tahap akhir sebelum warehouse atau shipment dan dapat memperbarui inventory/QC melalui integrasi STAGE.</p><h2>Parameter dan Reports</h2><p>Parameter menentukan mode hourly/daily, cutting, bundle-wise/piece-wise issue, penggunaan QC PROMAN/STAGE, barcode, dan approval Time Study. Laporan MIS merangkum planning dan hasil produksi untuk monitoring.</p>"
    },
    "proman-time-study": {
        title: "Time Study",
        module: "PROMAN",
        summary: "Menentukan waktu standar, urutan operasi, dan kebutuhan sumber daya garment.",
        content: "<h2>Tujuan dan Persiapan</h2><p>Time Study menentukan waktu yang diperlukan untuk setiap operasi garment. Siapkan garment, sub-classification, garment parts, Operation Master, dan Garment Wise Operation sebelum membuat studi.</p><h2>Operasi dan Standard Time</h2><p>Masukkan operasi sesuai urutan produksi, misalnya Shoulder Join, Side Seam, Sleeve Attach, Hem, lalu Final Operation. Garment Wise Operation menghubungkan garment, section, operation, machine type, dan SMV.</p><h2>Perencanaan Kapasitas</h2><p>Time Study dapat memuat flow chart, thread consumption, sampling trial, operator/helper, kebutuhan mesin dan manpower, serta lampiran ke Work Order atau Buyer Order.</p><h2>Approval</h2><p>Time Study dan piece rate dapat memerlukan approval sesuai parameter. Data yang disetujui menjadi acuan Production Planning dan target produksi.</p>"
    },
    "proman-cutting": {
        title: "Cutting",
        module: "PROMAN",
        summary: "Mengubah fabric yang sudah dikonfirmasi QC menjadi potongan dan bundle produksi.",
        content: "<h2>Alur Cutting</h2><p>Fabric → Lay → Cutting → Pieces → Bundle → Sticker → Line. Hanya roll berstatus Confirmed (C) dari Fabric QC yang dapat diteruskan ke Cutting; roll Non Confirmed (NC) tidak tersedia untuk proses ini.</p><h2>Pengaturan</h2><p>Parameter dapat mengatur cutting atau without cutting, pieces per bundle, bundle continue, last bundle round off, shade/color/roll-wise bundle, size breakup, size-wise atau ratio-wise bundle, dan excess cutting.</p><h2>Bundle dan Kontrol</h2><p>Bundle mengelompokkan potongan garment sebelum masuk line. Bundle dapat dibuat manual atau melalui sticker generation. Cut Plan Approval dan Roll Wise Bundle Breakup tersedia sesuai konfigurasi.</p><h2>Serah ke Produksi</h2><p>Periksa size, color, shade, roll, dan quantity bundle sebelum cutting issue ke line. Cutting Issue dapat menggunakan bundle-wise atau piece-wise sesuai parameter PROMAN.</p>"
    },
    "proman-production": {
        title: "Production",
        module: "PROMAN",
        summary: "Mencatat output produksi dan perpindahan garment antar proses.",
        content: "<h2>Perencanaan</h2><p>Production Planning menghubungkan Work Order, line, start/end date, target, dan quantity. Target mempertimbangkan jumlah mesin, line efficiency, working hours, serta sampling time.</p><h2>Pencatatan Hasil</h2><p>PROMAN dapat mencatat Hourly Production atau Daily Production. Fitur yang tersedia sesuai konfigurasi meliputi shift, vendor production, plan number, non-standard hours, automatic piece rate, color validation, dan excess quantity validation.</p><h2>Bundle dan Barcode</h2><p>Bundle tracking membantu mencegah bundle yang sama diproses dua kali pada operasi yang sama. Barcode dapat mengidentifikasi employee, bundle, dan transaksi produksi serta memperbarui Hourly Production.</p><h2>Perpindahan Proses</h2><p>Garment Issue memindahkan garment ke proses berikutnya, misalnya Production → Finishing Dispatch → Outsource Process → Finishing. Acknowledgement atau receipt dapat diwajibkan sebelum proses berikutnya.</p>"
    },
    "proman-quality-control": {
        title: "Quality Control",
        module: "PROMAN",
        summary: "Memvalidasi hasil garment dan mengendalikan proses sebelum barang diteruskan.",
        content: "<h2>Validasi QC</h2><p>QC memeriksa hasil terhadap cut quantity, color, size, process, dan Work Order. Hasil produksi dapat dibedakan menjadi Passed atau Reject dan dicatat bersama defect yang ditemukan.</p><h2>Kontrol Alur</h2><p>Parameter dapat mewajibkan QC sebelum proses berikutnya. Jika QC belum selesai, transaksi lanjutan dapat dibatasi agar quantity dan kualitas tetap terkendali.</p><h2>Hubungan dengan Finishing</h2><p>Setelah pemeriksaan, garment diteruskan melalui Garment Issue ke proses berikutnya atau Finishing. Bila PROMAN terintegrasi dengan STAGE, End Batch Summary dapat memperbarui inventory dan QC.</p><h2>Catatan Operasional</h2><p>Gunakan master Defects untuk menjaga konsistensi nama defect, nature, specification, code, dan status pada pencatatan Quality Control.</p>"
    }
};

async function loadMaterials() {
    const grid = document.getElementById("materialsGrid");
    const status = document.getElementById("materialsStatus");
    try {
        const response = await fetch("/api/cms/content");
        if (!response.ok) throw new Error("Could not load materials");
        const materials = (await response.json()).filter(function (material) {
            return material.module !== "ERP"
                && !String(material.module_id || "").startsWith("erp-")
                && !String(material.slug || "").startsWith("erp-");
        });
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
            const metadata = document.createElement("p");
            metadata.className = "cms-material-meta";
            metadata.textContent = formatEditedMetadata(material);
            const link = document.createElement("span");
            link.className = "card-link";
            link.textContent = material.pdf_url ? "Read PDF" : "Read material";
            card.append(number, title, summary);
            if (metadata.textContent) card.appendChild(metadata);
            card.appendChild(link);
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
    function showMaterial(material) {
        document.title = `${material.title} | Knowledge Base`;
        document.getElementById("materialModule").textContent = material.module || "KNOWLEDGE BASE";
        document.getElementById("materialTitle").textContent = material.title;
        document.getElementById("materialSummary").textContent = material.summary;
        renderContent(document.getElementById("materialContent"), material.content);
        const metadata = document.getElementById("materialMeta");
        metadata.textContent = formatEditedMetadata(material);
        metadata.hidden = !metadata.textContent;
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
    }

    const fallback = localMaterials[slug];
    try {
        const response = await fetch(`/api/cms/content?slug=${encodeURIComponent(slug)}`);
        if (!response.ok) throw new Error("Could not load material");
        const material = await response.json();
        if (!material && !fallback) throw new Error("Not found");
        showMaterial(material || fallback);
    } catch {
        if (fallback) showMaterial(fallback);
        else status.textContent = "Materi tidak ditemukan atau belum dipublish.";
    }
}

function formatEditedMetadata(material) {
    const editedAt = material.last_edited_at || material.updated_at;
    const editedBy = String(material.last_edited_by || "").trim();
    if (!editedAt || !editedBy) return "";

    const date = new Date(editedAt);
    if (Number.isNaN(date.getTime())) return "";
    return `Terakhir diedit ${date.toLocaleString("id-ID", {
        dateStyle: "long",
        timeStyle: "short"
    })} oleh ${editedBy}`;
}

function renderPlainText(container, value) {
    container.replaceChildren();
    String(value || "").split(/\n\s*\n/).filter(Boolean).forEach(function (paragraph) {
        const element = document.createElement("p");
        element.textContent = paragraph.trim();
        container.appendChild(element);
    });
}

function renderContent(container, value) {
    if (!/<[a-z][\s\S]*>/i.test(String(value || ""))) {
        renderPlainText(container, value);
        return;
    }

    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    const allowedTags = new Set(["A", "BR", "EM", "H2", "I", "IMG", "IFRAME", "LI", "OL", "P", "STRONG", "U", "UL"]);
    const allowedAttributes = new Set(["alt", "href", "src", "target", "rel", "title"]);

    function clean(node) {
        if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.nodeValue);
        if (node.nodeType !== Node.ELEMENT_NODE || !allowedTags.has(node.tagName)) return null;
        const cleanNode = document.createElement(node.tagName.toLowerCase());
        Array.from(node.attributes).forEach(function (attribute) {
            if (!allowedAttributes.has(attribute.name.toLowerCase())) return;
            if (["href", "src"].includes(attribute.name.toLowerCase()) && !safeUrl(attribute.value)) return;
            cleanNode.setAttribute(attribute.name, attribute.value);
        });
        Array.from(node.childNodes).forEach(function (child) {
            const cleanChild = clean(child);
            if (cleanChild) cleanNode.appendChild(cleanChild);
        });
        return cleanNode;
    }

    container.replaceChildren();
    Array.from(template.content.childNodes).forEach(function (node) {
        const cleanNode = clean(node);
        if (cleanNode) container.appendChild(cleanNode);
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
