const P={};
function page(title,eyebrow,intro,body){return{title,eyebrow,intro,body}}
const shot=(name)=>`<div class="shot"><div><strong>AREA SCREENSHOT APLIKASI: ${name}</strong><small>Masukkan screenshot aplikasi yang sesuai di area ini. Setelah screenshot tersedia, tambahkan penjelasan berdasarkan bagian yang terlihat pada layar.</small></div></div>`;
const detail=(title,module,intro,sections)=>page(title,module,intro,`
${sections.map(s=>`<section class="section"><h2>${s[0]}</h2>${s[1]}</section>`).join("")}
<section class="section"><h2>Pelajari di aplikasi</h2><div class="step"><div class="stepno">1</div><div><h4>Buka menu ${title}</h4><p>Gunakan menu yang sesuai pada aplikasi.</p></div></div><div class="step"><div class="stepno">2</div><div><h4>Perhatikan data yang tampil</h4><p>Cocokkan data aplikasi dengan penjelasan pada halaman ini.</p></div></div><div class="step"><div class="stepno">3</div><div><h4>Dokumentasikan</h4><p>Ambil screenshot dan letakkan pada area yang tersedia.</p></div></div>${shot(title)}</section>`);

P["/"]=page("ERP Knowledge Base","Knowledge Base","Pusat pembelajaran untuk memahami alur ERP dan fungsi setiap menu berdasarkan rangkuman yang tersedia.",`
<section class="section"><h2>Alur ERP</h2><p>Order berisi pesanan dari buyer dan menjadi dasar untuk proses selanjutnya. Setelah mengetahui apa yang harus diproduksi melalui order, perusahaan perlu mengetahui material yang diperlukan. Setelah angka consumption tersedia, kebutuhan material dapat dihitung dan proses purchasing dapat dilakukan. Material yang diterima kemudian masuk ke proses QC dan inventory.</p><div class="flow"><span>Order</span><i class="arrow">→</i><span>MRP</span><i class="arrow">→</i><span>Purchase</span><i class="arrow">→</i><span>Receive / GRN</span><i class="arrow">→</i><span>QC</span><i class="arrow">→</i><span>Stock</span><i class="arrow">→</i><span>Issue</span></div></section>
<section class="section"><h2>Modul</h2><div class="cards">
<a class="card" href="#/order"><span class="num">01</span><h3>Order</h3><p>Pesanan buyer, SPI, assortment, PO buyer, destination, ship date, style, color, dan size.</p></a>
<a class="card" href="#/mrp"><span class="num">02</span><h3>MRP</h3><p>Material, BOM, specification, article, color, size, fabric, trims, dan consumption.</p></a>
<a class="card" href="#/purchase"><span class="num">03</span><h3>Purchase</h3><p>RM purchase, Regular, Combined, General, Domestic, dan Import.</p></a>
<a class="card" href="#/inventory"><span class="num">04</span><h3>Inventory</h3><p>Receive, GRN, QC, issue, roll wise, rack wise, dan stock report.</p></a>
<a class="card" href="#/guide"><span class="num">→</span><h3>Guide Awal</h3><p>Urutan untuk mempelajari knowledge base dan aplikasi.</p></a>
<a class="card" href="#/faq"><span class="num">?</span><h3>FAQ</h3><p>Pertanyaan umum dari materi yang tersedia.</p></a>
</div></section>`);

P["/guide"]=page("Guide Awal","Getting Started","Pelajari alur terlebih dahulu, kemudian masuk ke setiap menu dan cocokkan penjelasan dengan tampilan aplikasi.",`
<section class="section"><h2>Urutan belajar</h2><p>Mulai dari Order karena order menjadi dasar untuk proses selanjutnya. Setelah mengetahui apa yang harus diproduksi, pelajari MRP untuk memahami material yang diperlukan. Setelah consumption tersedia, pelajari Purchase. Setelah supplier mengirim material, pelajari Receive, QC, dan Inventory.</p><div class="flow"><span>Order</span><i class="arrow">→</i><span>MRP</span><i class="arrow">→</i><span>Purchase</span><i class="arrow">→</i><span>Receive / GRN</span><i class="arrow">→</i><span>QC</span><i class="arrow">→</i><span>Inventory</span><i class="arrow">→</i><span>Issue</span></div></section>
<section class="section"><h2>Cara menggunakan knowledge base</h2>
<div class="step"><div class="stepno">1</div><div><h4>Baca penjelasan modul</h4><p>Pahami fungsi modul dan hubungan modul tersebut dengan alur ERP.</p></div></div>
<div class="step"><div class="stepno">2</div><div><h4>Buka menu yang ingin dipelajari</h4><p>Setiap menu memiliki penjelasan tersendiri.</p></div></div>
<div class="step"><div class="stepno">3</div><div><h4>Pelajari screenshot aplikasi</h4><p>Screenshot digunakan untuk menghubungkan teori dengan tampilan aplikasi yang digunakan.</p></div></div>
<div class="step"><div class="stepno">4</div><div><h4>Hubungkan data</h4><p>Gunakan Order Number, PO Number, Article, Color, Size, Quantity, dan data lain yang terlihat untuk memahami hubungan antar proses.</p></div></div></section>
<section class="section"><h2>Template screenshot</h2>${shot("MENU YANG SEDANG DIPELAJARI")}</section>`);

P["/order"]=detail("Order","Module 01","Order berisi pesanan dari buyer yang menjadi dasar untuk proses selanjutnya. Order dibuat di departemen Central Planning dan masing-masing order menggunakan SPI atau Surat Pesanan Internal.",[
["Isi Order",`<p>Di bagian Order terdapat Order Entry Detail, Assortment, PO Buyer, Destination, Ship Date, Style, Color, dan Size.</p><ul><li>Order Entry Detail</li><li>Assortment</li><li>PO Buyer</li><li>Destination</li><li>Ship Date</li><li>Style</li><li>Color</li><li>Size</li></ul>`],
["Order Number",`<p>Contoh order number adalah <span class="example">1C/2025/H&amp;M/4574</span>. 1C berarti order berasal dari unit 1 Giwangan. Terdapat 3 unit, yaitu Giwangan, Bantul, dan Kalasan. Unit 1 adalah Giwangan, unit 2 adalah Bantul, dan unit 3 adalah Kalasan. 2025 menunjukkan tahun order. H&amp;M menunjukkan buyer. 4574 merupakan nomor urut order.</p>`],
["Assortment",`<p>Assortment berkaitan dengan pembagian atau variasi order berdasarkan style, color, size, dan quantity.</p>`],
["Destination",`<p>Destination menunjukkan lokasi tujuan pengiriman barang. Lokasi buyer dan destination dapat berbeda. Contohnya buyer berada di Inggris, tetapi barang dikirim ke Brazil.</p>`],
["Ship Date",`<p>Ship Date menunjukkan tanggal pengiriman yang ditentukan.</p>`],
["Style, Color, dan Size",`<p>Style menunjukkan model atau identitas garment. Identitas garment juga ditentukan berdasarkan kombinasi style, color, dan size. Color menunjukkan warna dan dapat memiliki kode tertentu. Contohnya Color Pink Light dengan kode 51-304.</p>`],
["Costing dan proses awal",`<p>Sebelum order diproses, terdapat proses costing untuk menemukan kebutuhan harga berdasarkan permintaan buyer. Buyer menerima PO dari marketing, kemudian marketing melakukan analisis.</p>`]
]);

P["/order-entry-detail"]=detail("Order Entry Detail","Order","Order Entry Detail merupakan bagian dari Order.",[["Penjelasan",`<p>Menu ini termasuk informasi order yang digunakan sebagai dasar proses selanjutnya.</p>`]]);
P["/assortment"]=detail("Assortment","Order","Assortment berkaitan dengan pembagian atau variasi order berdasarkan style, color, size, dan quantity.",[["Penjelasan",`<p>Data assortment digunakan untuk melihat pembagian order berdasarkan variasi tersebut.</p>`]]);
P["/po-buyer"]=detail("PO Buyer","Order","PO Buyer merupakan bagian dari informasi Order yang berkaitan dengan PO dari buyer.",[["Penjelasan",`<p>Buyer menerima PO dari marketing, kemudian marketing melakukan analisis sebelum order diproses.</p>`]]);
P["/destination"]=detail("Destination","Order","Destination menunjukkan lokasi tujuan pengiriman barang.",[["Penjelasan",`<p>Lokasi buyer dan destination dapat berbeda. Contohnya buyer berada di Inggris, tetapi barang dikirim ke Brazil.</p>`]]);
P["/ship-date"]=detail("Ship Date","Order","Ship Date menunjukkan tanggal pengiriman yang ditentukan.",[["Penjelasan",`<p>Ship Date merupakan informasi yang terdapat pada order.</p>`]]);
P["/style"]=detail("Style","Order","Style menunjukkan model atau identitas garment.",[["Penjelasan",`<p>Style dapat menggunakan kode tertentu. Identitas garment ditentukan berdasarkan kombinasi style, color, dan size.</p>`]]);
P["/color"]=detail("Color","Order","Color merupakan informasi warna pada order.",[["Penjelasan",`<p>Contohnya Color Pink Light dengan kode 51-304.</p>`]]);
P["/size"]=detail("Size","Order","Size merupakan salah satu bagian dari informasi variasi order.",[["Penjelasan",`<p>Identitas garment ditentukan berdasarkan kombinasi style, color, dan size.</p>`]]);

P["/mrp"]=detail("MRP","Module 02","Setelah mengetahui apa yang harus diproduksi melalui order, perusahaan perlu mengetahui material apa saja yang diperlukan. MRP menggunakan BOM sebagai salah satu dasar untuk menentukan material.",[
["MRP-BOM",`<p>Bill of Material atau BOM berisi daftar material yang dibutuhkan untuk membuat suatu produk. BOM menjadi salah satu dasar dalam proses MRP atau Material Requirements Planning. BOM mencantumkan material beserta quantity dan spesifikasi unit material yang diperlukan.</p>`],
["Fabric dan Trims",`<p>Material dibagi menjadi Fabric dan Trims. Fabric yaitu kain. Trims yaitu material aksesoris seperti benang, label, renda, strap foam cup dan material sejenisnya.</p>`],
["Article dan Color",`<p>BOM digunakan untuk mengetahui material yang dibutuhkan beserta spesifikasinya. Misalnya satu bra membutuhkan beberapa jenis fabric. Setiap fabric memiliki article, color, spesifikasi, dan posisi penggunaan pada garment. Material tidak cukup diidentifikasi hanya berdasarkan warna. Article menjadi identitas penting untuk membedakan suatu fabric. Setelah article diketahui, fabric tersebut dibedakan lagi berdasarkan color.</p>`],
["Contoh",`<p>Article Fabric A dengan Color Black berbeda dengan Article Fabric A dengan Color White.</p>`],
["Sumber Article dan Supplier",`<p>Data Article dan color biasanya berasal dari supplier. Sebelumnya bagian merchandising sudah berkomunikasi dengan supplier mengenai material yang akan digunakan. Pada beberapa buyer, buyer bahkan sudah menentukan article dan supplier tempat material harus dibeli. Hal ini berkaitan dengan quality control. Buyer dapat menentukan supplier tertentu supaya material yang digunakan tetap sesuai standar mereka. Supplier juga bisa berada di luar Indonesia.</p>`]
]);

P["/rm-spec"]=detail("RM Specification","MRP","RM Specification berkaitan dengan spesifikasi raw material yang digunakan dalam MRP.",[["Penjelasan",`<p>Fabric specification dapat dilihat melalui MRP → Specification. Specification dapat menunjukkan material, article, color, position, dan informasi consumption.</p>`],["Contoh dari rangkuman",`<p>Pada contoh, nomor 11 dan 12 memiliki nomor yang sesuai dengan ID material DPO-05000-15R dan juga memiliki 2 color yang sesuai. Karena fabric specification menunjukkan position hanya armhole, maka fabric consumption dihitung pada bagian armhole.</p>`]]);
P["/consumption"]=detail("Consumption","MRP","Consumption menunjukkan kebutuhan material per unit.",[["Contoh perhitungan",`<p>Pada contoh size 60, consumption adalah 0.1338 yard. Dengan quantity 1540 pcs:</p><div class="example">1540 × 0.1338 = 206.052 yard</div><p>Untuk S6Y XLO Armhole, consumption 0.1278 yard/pcs dengan quantity 1591 pcs:</p><div class="example">1591 × 0.1278 = 203.30298 yard</div>`]]);
P["/fabric-trims"]=detail("Fabric & Trims","MRP","Material dibagi menjadi Fabric dan Trims.",[["Fabric",`<p>Fabric yaitu kain.</p>`],["Trims",`<p>Trims yaitu material aksesoris seperti benang, label, renda, strap foam cup dan material sejenisnya.</p>`]]);
P["/article"]=detail("Article","MRP","Article menjadi identitas penting untuk membedakan suatu fabric.",[["Penjelasan",`<p>Setelah article diketahui, fabric dibedakan lagi berdasarkan color. Contohnya Article Fabric A dengan Color Black atau Article Fabric A dengan Color White.</p>`]]);
P["/mrp-color"]=detail("Color","MRP","Color digunakan bersama article untuk membedakan material.",[["Penjelasan",`<p>Material tidak cukup diidentifikasi hanya berdasarkan warna. Article menjadi identitas material, kemudian material dibedakan berdasarkan color.</p>`]]);
P["/mrp-size"]=detail("Size","MRP","Size muncul sebagai bagian dari data yang digunakan dalam kebutuhan material.",[["Penjelasan",`<p>Pada contoh fabric specification, terdapat size 60 dengan consumption 0.1338 yards.</p>`]]);

P["/purchase"]=detail("Purchase","Module 03","Setelah angka consumption tersedia, barulah kebutuhan material dapat dihitung dan proses purchasing dapat dilakukan.",[
["Jenis Purchase",`<p>Untuk purchase terdapat 3 macam PO, yaitu Regular, Combined, dan General.</p><ul><li>Regular</li><li>Combined</li><li>General</li></ul>`],
["Regular",`<p>Regular menggunakan SPI sebagai acuan karena sifatnya spesifik. Nomor SPI akan terlihat langsung pada PO.</p>`],
["Combined",`<p>Combine digunakan ketika beberapa kebutuhan dapat digabung dalam satu pembelian, jadi memiliki beberapa SPI.</p>`],
["General",`<p>General digunakan untuk kebutuhan yang sifatnya lebih umum dan tidak berkaitan langsung dengan SPI.</p>`],
["Kode PO",`<p>Kode pada nomor PO juga dapat menunjukkan jenis material. F untuk Fabric, T untuk Trim, dan O untuk Other. Untuk produksi, F dan T merupakan jenis yang paling sering digunakan.</p>`],
["Domestic dan Import",`<p>Purchase dibedakan berdasarkan Domestic dan Impor. Domestic yaitu lokal, sedangkan Impor untuk luar negeri. Kode I artinya Internasional dan P artinya lokal.</p>`],
["Contoh Regular Purchase",`<p>Supplier: PT Seyoung Industry. Buyer: Hanesbrands Inc. Order number: 2B/2026/HBI/1821. Material: Fabric. Currency: USD. PO Number: HO/2026/FP761/BRJ. BRJ merupakan unit/divisinya. Keterangan material purchase mencakup Fabric circular dan sample test. Salah satunya color Black dan satunya XLO. ID material: DPO-05000-15R.</p>`]
]);

P["/rm-purchase"]=detail("RM Purchase","Purchase","RM Purchase digunakan dalam proses pembelian raw material.",[["Contoh",`<p>Pada contoh, supplier adalah PT Seyoung Industry dan buyer adalah Hanesbrands Inc. Material berupa Fabric dengan currency USD. PO Number adalah HO/2026/FP761/BRJ.</p>`]]);
P["/bom"]=detail("BOM","MRP / Purchase","Bill of Material berisi daftar material yang dibutuhkan untuk membuat suatu produk.",[["Isi BOM",`<p>BOM mencantumkan material beserta quantity dan spesifikasi unit material yang diperlukan. BOM menjadi salah satu dasar dalam proses MRP.</p>`]]);
P["/regular"]=detail("Regular","Purchase","Regular menggunakan SPI sebagai acuan karena sifatnya spesifik.",[["Penjelasan",`<p>Nomor SPI akan terlihat langsung pada PO.</p>`]]);
P["/combined"]=detail("Combined","Purchase","Combined digunakan ketika beberapa kebutuhan dapat digabung dalam satu pembelian.",[["Penjelasan",`<p>Combined memiliki beberapa SPI karena beberapa kebutuhan digabung dalam satu pembelian.</p>`]]);
P["/general"]=detail("General","Purchase","General digunakan untuk kebutuhan yang sifatnya lebih umum.",[["Penjelasan",`<p>General tidak berkaitan langsung dengan SPI.</p>`]]);
P["/domestic-import"]=detail("Domestic & Import","Purchase","Purchase dibedakan berdasarkan sumber pembelian.",[["Domestic",`<p>Domestic yaitu lokal, masih di Indonesia.</p>`],["Import",`<p>Import digunakan untuk pembelian dari luar negeri.</p>`],["Kode",`<p>I artinya Internasional. P artinya lokal.</p>`]]);

P["/inventory"]=detail("Inventory","Module 04","Material yang lolos QC masuk ke Inventory. Inventory menyimpan dan mengelola material yang tersedia di gudang. Ada raw material Roll Wise dan Rack Wise.",[
["GRN / Receive",`<p>Setelah supplier mengirim barang, gudang menerima material tersebut. Proses penerimaan material disebut GRN atau Raw Material Received. Saat melakukan received, user memasukan nomor PO, SPI, Material, Quantity yang diterima, dan informasi penerimaan lainnya.</p>`],
["Quantity Receive",`<p>Quantity yang diterima tidak selalu sama dengan quantity pada PO. Supplier dapat mengirim material secara parsial. Gudang melakukan receive setiap kali material datang.</p>`],
["Roll Wise dan Rack Wise",`<p>RM Roll Wise berkaitan dengan pengelolaan material yang disimpan dalam bentuk roll terutama fabric. Material yang diterima memiliki quantity tertentu, kemudian dapat dipecah menjadi beberapa roll. Setiap roll memiliki detail dan nomor tertentu. RM Roll Wise dan Rack Wise membantu inventory mengelola material lebih detail berdasarkan roll dan lokasi penyimpanannya.</p>`],
["Issue",`<p>Setelah material tersedia di inventory, material dapat dikeluarkan untuk kebutuhan produksi melalui proses issue. Material issue berarti material dikeluarkan dari inventory untuk digunakan dalam proses produksi.</p>`]
]);

P["/receive"]=detail("RM Receive / GRN","Inventory","RM Receive mencatat material yang diterima dari supplier.",[
["Proses",`<p>Di menu Inventory → Issue/Receipt, setelah supplier mengirim barang, gudang menerima material. Proses penerimaan disebut GRN atau Raw Material Received.</p>`],
["Data yang dimasukkan",`<p>User memasukan nomor PO, SPI, Material, Quantity yang diterima, dan informasi penerimaan lainnya.</p>`],
["Kode GRN",`<p>Contoh regular PO yang sama sudah received dengan GRN No. 2026/Y2/IDMP/F4429. Jika GRN IDMP berarti dari supplier ke gudang. Jika dari gudang ke SPI, kodenya menjadi ODPD yang berarti issued.</p>`],
["Receive parsial",`<p>Quantity yang diterima tidak selalu sama dengan quantity pada PO. Contohnya PO foam cup 1.800 pcs, pengiriman pertama 500 pcs. Sistem mencatat 500 pcs sebagai quantity yang sudah diterima dan sisanya masih pending. Supplier dapat mengirim material secara parsial dan gudang melakukan receive setiap kali material datang.</p>`]
]);

P["/qc"]=detail("QC","Inventory","Setelah material diterima, material masuk ke proses Quality Control.",[
["Pemeriksaan",`<p>QC melakukan pemeriksaan terhadap barang yang diterima. Quantity hasil pemeriksaan dapat dibagi menjadi Good atau sesuai dan Reject.</p>`],
["Jika Good",`<p>Material Good masuk ke Stock.</p>`],
["Jika Reject",`<p>Jika material Reject, material dapat dikembalikan kepada supplier melalui proses return.</p>`],
["Flow",`<div class="flow"><span>Supplier</span><i class="arrow">→</i><span>Receive / GRN</span><i class="arrow">→</i><span>Good</span><i class="arrow">→</i><span>Stock</span></div><div class="flow"><span>Supplier</span><i class="arrow">→</i><span>Receive / GRN</span><i class="arrow">→</i><span>Reject</span><i class="arrow">→</i><span>Return to Supplier</span></div><p>Nomor GRN menjadi salah satu referensi dalam proses QC.</p>`]
]);

P["/issue"]=detail("RM Issue","Inventory","Material Issue berarti material dikeluarkan dari inventory untuk digunakan dalam proses produksi.",[["Flow",`<div class="flow"><span>Stock</span><i class="arrow">→</i><span>Issue</span><i class="arrow">→</i><span>Production</span></div>`],["Penjelasan",`<p>Setelah material tersedia di inventory, material dapat dikeluarkan untuk kebutuhan produksi melalui proses issue.</p>`]]);
P["/rollwise"]=detail("RM Roll Wise","Inventory","RM Roll Wise berkaitan dengan pengelolaan material yang disimpan dalam bentuk roll terutama fabric.",[["Penjelasan",`<p>Material yang diterima memiliki quantity tertentu. Material tersebut kemudian dapat dipecah menjadi beberapa roll. Setiap roll memiliki detail dan nomor tertentu.</p>`],["Tujuan",`<p>RM Roll Wise dan Rack Wise membantu inventory mengelola material secara lebih detail berdasarkan roll dan lokasi penyimpanannya.</p>`]]);
P["/rackwise"]=detail("RM Rack Wise","Inventory","RM Rack Wise berkaitan dengan lokasi penyimpanan material di gudang.",[["Penjelasan",`<p>RM Roll Wise dan Rack Wise membantu inventory mengelola material secara lebih detail berdasarkan roll dan lokasi penyimpanannya.</p>`]]);
P["/stockreport"]=detail("Stock Report","Inventory","Stock Report berkaitan dengan informasi stock material di inventory.",[["Penjelasan",`<p>Inventory menyimpan dan mengelola material yang tersedia di gudang. Stock menjadi hasil material yang masuk setelah proses penerimaan dan QC Good.</p>`]]);

P["/faq"]=page("FAQ","Reference","Pertanyaan umum berdasarkan informasi yang tersedia pada rangkuman.",`
<section class="section">
<div class="qa"><b>Apa dasar proses setelah Order?</b><p>Order menjadi dasar untuk proses selanjutnya. Setelah mengetahui apa yang harus diproduksi melalui order, perusahaan perlu mengetahui material yang diperlukan.</p></div>
<div class="qa"><b>Apa dasar proses MRP?</b><p>BOM menjadi salah satu dasar dalam proses MRP.</p></div>
<div class="qa"><b>Kapan purchasing dilakukan?</b><p>Setelah angka consumption tersedia, kebutuhan material dapat dihitung dan proses purchasing dapat dilakukan.</p></div>
<div class="qa"><b>Apa jenis PO dalam Purchase?</b><p>Regular, Combined, dan General.</p></div>
<div class="qa"><b>Apa perbedaan Regular dan Combined?</b><p>Regular menggunakan SPI sebagai acuan dan sifatnya spesifik. Combined digunakan ketika beberapa kebutuhan dapat digabung dalam satu pembelian sehingga memiliki beberapa SPI.</p></div>
<div class="qa"><b>Apa perbedaan Domestic dan Import?</b><p>Domestic yaitu lokal. Import untuk luar negeri. Kode I berarti Internasional dan P berarti lokal.</p></div>
<div class="qa"><b>Apakah quantity received selalu sama dengan PO?</b><p>Tidak. Supplier dapat mengirim material secara parsial. Gudang melakukan receive setiap kali material datang.</p></div>
<div class="qa"><b>Apa yang terjadi setelah Receive?</b><p>Material masuk ke proses QC. Material Good masuk ke Stock. Material Reject dapat dikembalikan kepada supplier.</p></div>
<div class="qa"><b>Apa fungsi RM Roll Wise?</b><p>Untuk mengelola material yang disimpan dalam bentuk roll, terutama fabric.</p></div>
<div class="qa"><b>Apa fungsi RM Issue?</b><p>Untuk mengeluarkan material dari inventory untuk digunakan dalam proses produksi.</p></div>
</section>`);

function render(){
 let r=location.hash.slice(1)||"/"; let p=P[r]||P["/"];
 document.querySelector("#app").innerHTML=`<div class="hero"><div class="eyebrow">${p.eyebrow}</div><h1>${p.title}</h1><p>${p.intro}</p></div>${p.body}`;
 window.scrollTo(0,0);
}
window.addEventListener("hashchange",render);render();
document.querySelector("#mobileBtn").onclick=()=>document.querySelector("#sidebar").classList.toggle("open");
const search=document.querySelector("#search");
search.addEventListener("input",()=>{let q=search.value.toLowerCase().trim();if(!q)return;let x=Object.entries(P).find(([k,v])=>(v.title+" "+v.intro+" "+v.body).toLowerCase().includes(q));if(x)location.hash=x[0]});
