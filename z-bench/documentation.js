(function () {
    const content = document.getElementById("documentation-content");
    if (!content) return;

    function imageSlot(label) {
        const id = "image-" + Math.random().toString(36).slice(2);
        return `
            <div class="doc-image-slot">
                <label for="${id}">
                    <i class="ph ph-image-square"></i>
                    <strong>${label}</strong>
                    <span>Tambahkan screenshot atau foto di sini</span>
                </label>
                <input id="${id}" type="file" accept="image/*">
                <img alt="${label}" hidden>
            </div>
        `;
    }

    const pages = {
        "stage-order": {
            title: "Order Entry Detail",
            id: "1. Order",
            idText: `<p><strong>Order</strong> berisi pesanan dari buyer yang menjadi dasar untuk proses selanjutnya. Masing-masing order memiliki nomor <strong>SPI (Surat Pesanan Internal)</strong>.</p>
                <h4>Informasi yang dapat dilihat</h4><ul><li><strong>Order number</strong></li><li><strong>Buyer</strong></li><li><strong>Order date</strong></li><li><strong>Order quantity</strong></li><li><strong>Ship date</strong></li><li>Informasi order lainnya</li></ul>
                <p>Contoh format order number / SPI: <strong>2B/2026/HBI/1821</strong>. <strong>2B</strong> menunjukkan unit, <strong>2026</strong> menunjukkan tahun order, <strong>HBI</strong> menunjukkan buyer, dan <strong>1821</strong> menunjukkan nomor urut order.</p>
                <p><strong>Assortment</strong> digunakan untuk melihat pembagian order berdasarkan <strong>style, color, size,</strong> dan <strong>quantity</strong>. <strong>PO Buyer</strong> menjadi referensi utama untuk mengetahui produk yang harus diproduksi.</p>
                <p><strong>Destination</strong> menunjukkan lokasi tujuan pengiriman dan tidak selalu sama dengan lokasi buyer. Contoh: buyer Inggris, destination Brazil.</p>
                <p><strong>Ship date</strong> menunjukkan tanggal barang harus dikirim. <strong>Style</strong> adalah model garment, <strong>color</strong> adalah warna produk atau material, dan <strong>size</strong> adalah ukuran produk.</p>`,
            enText: `<p>An <strong>Order</strong> contains a buyer request and becomes the basis for the next processes. Each order has an <strong>SPI (Internal Order Letter)</strong> number.</p>
                <h4>Information displayed</h4><ul><li><strong>Order number</strong></li><li><strong>Buyer</strong></li><li><strong>Order date</strong></li><li><strong>Order quantity</strong></li><li><strong>Ship date</strong></li><li>Other order information</li></ul>
                <p>Example: <strong>2B/2026/HBI/1821</strong>. <strong>2B</strong> is the unit, <strong>2026</strong> is the order year, <strong>HBI</strong> is the buyer, and <strong>1821</strong> is the sequence number.</p>
                <p><strong>Assortment</strong> shows distribution by <strong>style, color, size,</strong> and <strong>quantity</strong>. <strong>Buyer PO</strong> is the main reference for the products to be produced.</p>
                <p><strong>Destination</strong> is the shipping location and may differ from the buyer location. <strong>Ship date</strong> is the requested shipping date. <strong>Style</strong>, <strong>color</strong>, and <strong>size</strong> identify the garment model, color, and measurement.</p>`,
            image: "Screenshot Order Entry Detail"
        },
        "mrp-material": {
            title: "Raw Material Specifications",
            id: "2. MRP",
            idText: `<p><strong>MRP (Material Requirement Planning)</strong> adalah sistem digital yang merencanakan kebutuhan material produksi berdasarkan order. <strong>BOM (Bill of Material)</strong> berisi material, jumlah, dan spesifikasi yang dibutuhkan.</p>
                <h4>Fabric dan Trims</h4><ul><li><strong>Fabric</strong> adalah kain sebagai material utama garment.</li><li><strong>Trims</strong> adalah material pendukung seperti benang, label, renda, strap, dan foam cup.</li></ul>
                <p><strong>RM Specifications</strong> dapat menampilkan <strong>material, article, color, size, position,</strong> dan <strong>consumption</strong>. <strong>Article</strong> membedakan material, sedangkan <strong>color</strong> membedakan variasinya.</p>
                <p><strong>Consumption</strong> adalah kebutuhan material untuk satu unit produk. Contoh: 0.1338 yard/pcs x 1.540 pcs = <strong>206.052 yard</strong>. Consumption dapat berbeda berdasarkan size.</p>
                <h4>Langkah penggunaan</h4><ol><li>Buka menu <strong>MRP</strong>.</li><li>Klik <strong>Specifications</strong>.</li><li>Pilih <strong>View</strong>.</li><li>Tekan <strong>F8</strong> untuk filter berdasarkan SPI atau nomor PO.</li><li>Pilih SPI, lalu pilih <strong>Fabric</strong> atau <strong>Trims</strong>.</li></ol>`,
            enText: `<p><strong>MRP (Material Requirement Planning)</strong> is a digital system for planning production material requirements from an order. A <strong>BOM (Bill of Material)</strong> lists the required materials, quantities, and specifications.</p>
                <h4>Fabric and Trims</h4><ul><li><strong>Fabric</strong> is the main garment material.</li><li><strong>Trims</strong> are supporting materials such as thread, labels, lace, straps, and foam cups.</li></ul>
                <p><strong>RM Specifications</strong> displays <strong>material, article, color, size, position,</strong> and <strong>consumption</strong>. <strong>Article</strong> identifies the material and <strong>color</strong> identifies its variation.</p>
                <p><strong>Consumption</strong> is the material required for one unit. Example: 0.1338 yard/pcs x 1,540 pcs = <strong>206.052 yards</strong>. Consumption may vary by size.</p>
                <h4>How to use it</h4><ol><li>Open <strong>MRP</strong>.</li><li>Click <strong>Specifications</strong>, then <strong>View</strong>.</li><li>Press <strong>F8</strong> to filter by SPI or PO number.</li><li>Select the SPI and choose <strong>Fabric</strong> or <strong>Trims</strong>.</li></ol>`,
            image: "Screenshot RM Specifications"
        },
        "purchase-order": {
            title: "Purchase Types",
            id: "3. Purchase",
            idText: `<p><strong>Purchase</strong> dilakukan setelah kebutuhan material dari MRP diketahui. Purchase dibagi menjadi <strong>Domestic</strong> untuk supplier lokal dan <strong>Import</strong> untuk supplier luar negeri.</p>
                <h4>Regular</h4><p><strong>Regular</strong> digunakan ketika pembelian berkaitan dengan satu SPI tertentu. SPI menjadi acuan pembuatan PO dan dapat terlihat langsung pada PO.</p>
                <h4>Combined</h4><p><strong>Combined</strong> menggabungkan beberapa kebutuhan material dalam satu pembelian. Satu PO dapat memiliki beberapa SPI, misalnya SPI 001 untuk Fabric A, SPI 002 untuk Fabric B, dan SPI 003 untuk Fabric C.</p>
                <h4>General</h4><p><strong>General</strong> digunakan untuk kebutuhan umum yang tidak berkaitan langsung dengan SPI tertentu.</p>
                <p>Data purchase dapat berkaitan dengan <strong>supplier, buyer, order number, material, quantity, currency,</strong> dan <strong>PO number</strong>. Kode <strong>P</strong> menunjukkan lokal, sedangkan <strong>I</strong> menunjukkan internasional.</p>`,
            enText: `<p><strong>Purchase</strong> is performed after MRP requirements are known. It is divided into <strong>Domestic</strong> for local suppliers and <strong>Import</strong> for overseas suppliers.</p>
                <h4>Regular</h4><p><strong>Regular</strong> is used when a purchase is related to one SPI. The SPI is the reference for creating the PO and can be seen on it.</p>
                <h4>Combined</h4><p><strong>Combined</strong> joins several material requirements in one purchase. One PO can contain several SPIs, such as SPI 001 for Fabric A, SPI 002 for Fabric B, and SPI 003 for Fabric C.</p>
                <h4>General</h4><p><strong>General</strong> is used for general requirements not directly related to a specific SPI.</p>
                <p>Purchase data may include <strong>supplier, buyer, order number, material, quantity, currency,</strong> and <strong>PO number</strong>. Code <strong>P</strong> means local and <strong>I</strong> means international.</p>`,
            image: "Screenshot Purchase Order"
        },
        "purchase-material": {
            title: "RM Purchase",
            id: "Purchase Material",
            idText: `<p><strong>RM Purchase</strong> digunakan untuk melakukan pembelian raw material. Sebelum membuat PO, pastikan kebutuhan dari MRP, supplier, buyer, material, quantity, currency, dan SPI sudah sesuai.</p>
                <h4>Data yang berhubungan</h4><ul><li><strong>Supplier</strong></li><li><strong>Buyer</strong></li><li><strong>Order number / SPI</strong></li><li><strong>Material</strong></li><li><strong>Quantity</strong></li><li><strong>Currency</strong></li><li><strong>PO number</strong></li></ul>
                <p><strong>BOM</strong> membantu memastikan fabric, trims, thread, label, dan material lain yang diperlukan sudah tercantum. Periksa juga apakah purchase termasuk Domestic atau Import dan apakah tipenya Regular, Combined, atau General.</p>`,
            enText: `<p><strong>RM Purchase</strong> is used to buy raw materials. Before creating a PO, verify the MRP requirement, supplier, buyer, material, quantity, currency, and SPI.</p>
                <h4>Related data</h4><ul><li><strong>Supplier</strong></li><li><strong>Buyer</strong></li><li><strong>Order number / SPI</strong></li><li><strong>Material</strong></li><li><strong>Quantity</strong></li><li><strong>Currency</strong></li><li><strong>PO number</strong></li></ul>
                <p><strong>BOM</strong> confirms that fabric, trims, thread, labels, and other required materials are listed. Also check whether the purchase is Domestic or Import and whether it is Regular, Combined, or General.</p>`,
            image: "Screenshot RM Purchase"
        },
        "goods-receipt": {
            title: "Purchase Goods Receipt",
            id: "Goods Receipt from Purchase",
            idText: `<p>Setelah supplier mengirim material, proses penerimaan dicatat melalui <strong>GRN (Goods Receipt Note)</strong>. Hubungkan penerimaan dengan <strong>PO Number, SPI, material,</strong> dan quantity yang benar.</p><p>Quantity yang diterima tidak selalu sama dengan quantity PO. Supplier dapat mengirim secara parsial; setiap pengiriman dicatat sebagai penerimaan dan sisa quantity tetap pending.</p>`,
            enText: `<p>When a supplier sends material, the receipt is recorded through a <strong>GRN (Goods Receipt Note)</strong>. Link the receipt to the correct <strong>PO Number, SPI, material,</strong> and quantity.</p><p>The received quantity may differ from the PO quantity. Suppliers may deliver partially; each delivery is recorded and the remaining quantity stays pending.</p>`,
            image: "Screenshot Purchase Goods Receipt"
        },
        "inventory-grn": {
            title: "RM Receive / GRN",
            id: "4. Inventory - Receiving",
            idText: `<p><strong>Inventory</strong> menyimpan material yang sudah diterima di gudang. Alurnya adalah <strong>Supplier -&gt; Receive/GRN -&gt; QC -&gt; Good -&gt; Stock</strong>. Jika ditolak: <strong>Supplier -&gt; Receive/GRN -&gt; QC -&gt; Reject -&gt; Return to Supplier</strong>.</p><p>Saat melakukan <strong>RM Receive</strong>, user memasukkan <strong>PO Number, SPI, Material, Quantity,</strong> dan informasi penerimaan lainnya. <strong>IDMP</strong> berarti supplier ke gudang, sedangkan <strong>ODPD</strong> berarti issued dari gudang ke SPI.</p><p>Contoh PO foam cup 1.800 pcs: pengiriman pertama 500 pcs dicatat received, sementara 1.300 pcs masih pending.</p>`,
            enText: `<p><strong>Inventory</strong> stores materials received in the warehouse. The flow is <strong>Supplier -&gt; Receive/GRN -&gt; QC -&gt; Good -&gt; Stock</strong>. For rejected material: <strong>Supplier -&gt; Receive/GRN -&gt; QC -&gt; Reject -&gt; Return to Supplier</strong>.</p><p>When using <strong>RM Receive</strong>, enter <strong>PO Number, SPI, Material, Quantity,</strong> and other receipt information. <strong>IDMP</strong> means supplier to warehouse, while <strong>ODPD</strong> means issued from warehouse to an SPI.</p><p>Example: for an 1,800-piece foam cup PO, a first delivery of 500 pieces is received and 1,300 pieces remain pending.</p>`,
            image: "Screenshot Inventory GRN"
        },
        "inventory-stock": {
            title: "Stock, Issue, Roll Wise, and Rack Wise",
            id: "Inventory Stock Management",
            idText: `<p><strong>RM Issue</strong> mengeluarkan material dari inventory untuk produksi. Alurnya <strong>Stock -&gt; Issue -&gt; Production</strong>.</p><p><strong>RM Roll Wise</strong> mengelola material berbentuk roll, terutama fabric. Contoh received fabric 1.000 yard dibagi menjadi Roll 001 = 400 yard, Roll 002 = 350 yard, dan Roll 003 = 250 yard.</p><p><strong>RM Rack Wise</strong> menunjukkan lokasi penyimpanan material di rack. <strong>Stock Report</strong> digunakan untuk memonitor material, quantity, status stock, dan lokasi penyimpanan.</p>`,
            enText: `<p><strong>RM Issue</strong> sends material from inventory to production. The flow is <strong>Stock -&gt; Issue -&gt; Production</strong>.</p><p><strong>RM Roll Wise</strong> manages roll-based material, especially fabric. Example: 1,000 received yards are divided into Roll 001 = 400 yards, Roll 002 = 350 yards, and Roll 003 = 250 yards.</p><p><strong>RM Rack Wise</strong> shows the storage rack location. <strong>Stock Report</strong> monitors material, quantity, stock status, and storage location.</p>`,
            image: "Screenshot Stock and Roll Wise"
        },
        "stage-packing": { title: "Packing", id: "Stage - Packing", idText: `<p><strong>Packing</strong> adalah tahap pengemasan produk setelah proses produksi selesai. Gunakan halaman ini untuk mendokumentasikan standar packing, pembagian quantity, carton, dan hasil pemeriksaan sebelum shipment.</p>`, enText: `<p><strong>Packing</strong> is the packaging stage after production is complete. Use this page to document packing standards, quantity distribution, cartons, and checks before shipment.</p>`, image: "Screenshot Packing" },
        "production": { title: "Production", id: "Production Process", idText: `<p>Proses produksi pada materi ini berlanjut dari material yang di-issue menuju <strong>Cutting</strong>, <strong>Sewing</strong>, dan proses berikutnya sampai packing.</p>`, enText: `<p>The production process continues from issued material to <strong>Cutting</strong>, <strong>Sewing</strong>, and subsequent processes until packing.</p>`, image: "Screenshot Production" },
        "production-cutting": { title: "Cutting", id: "Production - Cutting", idText: `<p><strong>Cutting</strong> adalah proses pemotongan material berdasarkan kebutuhan order, style, color, size, dan quantity. Gunakan slot gambar untuk menambahkan instruksi atau screenshot form cutting perusahaan.</p>`, enText: `<p><strong>Cutting</strong> cuts material according to the order, style, color, size, and quantity. Use the image slot to add the company's cutting instructions or form screenshot.</p>`, image: "Screenshot Cutting" },
        "production-sewing": { title: "Sewing", id: "Production - Sewing", idText: `<p><strong>Sewing</strong> adalah proses menjahit bagian garment setelah cutting. Dokumentasikan urutan proses, line, output, dan pemeriksaan kualitas sesuai prosedur perusahaan.</p>`, enText: `<p><strong>Sewing</strong> joins garment parts after cutting. Document the process sequence, line, output, and quality checks according to company procedures.</p>`, image: "Screenshot Sewing" },
        "shipment-index": { title: "Shipment", id: "Shipment", idText: `<p><strong>Shipment</strong> menyiapkan barang untuk dikirim sesuai <strong>destination</strong> dan <strong>ship date</strong> pada order. Pastikan quantity dan dokumen pengiriman sesuai.</p>`, enText: `<p><strong>Shipment</strong> prepares goods for dispatch according to the order's <strong>destination</strong> and <strong>ship date</strong>. Verify the quantity and shipping documents.</p>`, image: "Screenshot Shipment" },
        "shipment-packing": { title: "Shipment Packing", id: "Shipment - Packing", idText: `<p>Pada tahap <strong>Shipment Packing</strong>, barang disiapkan dan diverifikasi berdasarkan order, quantity, carton, dan tujuan pengiriman sebelum dikirim.</p>`, enText: `<p>During <strong>Shipment Packing</strong>, goods are prepared and verified by order, quantity, carton, and destination before dispatch.</p>`, image: "Screenshot Shipment Packing" },
        "shipment-export": { title: "Export", id: "Shipment - Export", idText: `<p><strong>Export</strong> digunakan untuk mendokumentasikan pengiriman internasional. Periksa destination, dokumen, quantity, dan jadwal ship date sebelum proses selesai.</p>`, enText: `<p><strong>Export</strong> documents international shipments. Check the destination, documents, quantity, and ship date before completing the process.</p>`, image: "Screenshot Export" }
    };

    const page = pages[document.body.dataset.page];
    if (!page) return;

    content.innerHTML = `
        <article class="doc-block">
            <span class="doc-label">Bahasa Indonesia</span>
            <h3>${page.id}</h3>
            ${page.idText}
            ${imageSlot(page.image)}
            <div class="doc-english">
                <span class="doc-label">English</span>
                <h3>${page.title}</h3>
                ${page.enText}
            </div>
        </article>
        <article class="doc-block glossary">
            <span class="doc-label">Glossarium / Glossary</span>
            <h3>Istilah penting</h3>
            <dl>
                <dt><strong>SPI</strong></dt><dd>Surat Pesanan Internal / Internal Order Letter.</dd>
                <dt><strong>BOM</strong></dt><dd>Bill of Material, daftar material yang diperlukan untuk membuat produk.</dd>
                <dt><strong>MRP</strong></dt><dd>Material Requirement Planning, perencanaan kebutuhan material.</dd>
                <dt><strong>GRN</strong></dt><dd>Goods Receipt Note, catatan penerimaan barang atau raw material.</dd>
                <dt><strong>PO</strong></dt><dd>Purchase Order, dokumen pemesanan material.</dd>
                <dt><strong>Fabric</strong></dt><dd>Kain sebagai material utama garment.</dd>
                <dt><strong>Trims</strong></dt><dd>Material pendukung seperti benang, label, renda, strap, dan foam cup.</dd>
                <dt><strong>Consumption</strong></dt><dd>Kebutuhan material untuk membuat satu unit produk.</dd>
                <dt><strong>Domestic</strong></dt><dd>Pembelian dari supplier lokal atau dalam negeri.</dd>
                <dt><strong>Import</strong></dt><dd>Pembelian dari supplier luar negeri.</dd>
                <dt><strong>QC</strong></dt><dd>Quality Control, pemeriksaan kualitas material atau barang.</dd>
                <dt><strong>Roll Wise</strong></dt><dd>Pengelolaan material berdasarkan nomor dan quantity setiap roll.</dd>
                <dt><strong>Rack Wise</strong></dt><dd>Pengelolaan material berdasarkan lokasi rack penyimpanan.</dd>
            </dl>
        </article>
    `;

    content.querySelectorAll("input[type=file]").forEach(function (input) {
        input.addEventListener("change", function () {
            const image = input.parentElement.querySelector("img");
            const file = input.files && input.files[0];
            if (!file || !file.type.startsWith("image/")) return;
            image.src = URL.createObjectURL(file);
            image.hidden = false;
            input.parentElement.classList.add("has-image");
        });
    });
})();
