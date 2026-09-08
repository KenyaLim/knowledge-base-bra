const pages = {
"/": {
 title:"ERP Knowledge Base",
 eyebrow:"Knowledge Base",
 intro:"Panduan belajar ERP dari alur Order sampai Inventory. Gunakan halaman ini sebagai titik awal sebelum mempelajari setiap menu.",
 body:`
 <div class="section"><h2>Mulai dari sini</h2><p class="muted">Ikuti urutan proses agar hubungan antar menu lebih mudah dipahami.</p>
 <div class="flow"><span>Order</span><span class="arrow">→</span><span>MRP</span><span class="arrow">→</span><span>Purchase</span><span class="arrow">→</span><span>Receive / GRN</span><span class="arrow">→</span><span>QC</span><span class="arrow">→</span><span>Inventory</span><span class="arrow">→</span><span>Issue</span></div></div>
 <div class="section"><h2>Modul</h2><div class="grid">
 <a class="card" href="#/order"><div class="icon">01</div><h3>Order</h3><p>Memahami pesanan buyer dan detail order.</p></a>
 <a class="card" href="#/mrp"><div class="icon">02</div><h3>MRP</h3><p>Memahami material dan perhitungan kebutuhan.</p></a>
 <a class="card" href="#/purchase"><div class="icon">03</div><h3>Purchase</h3><p>Memahami proses pembelian material.</p></a>
 <a class="card" href="#/inventory"><div class="icon">04</div><h3>Inventory</h3><p>Memahami penerimaan, stock, roll, rack, dan issue.</p></a>
 <a class="card" href="#/guide"><div class="icon">→</div><h3>Guide Awal</h3><p>Urutan belajar dan cara membaca halaman modul.</p></a>
 <a class="card" href="#/faq"><div class="icon">?</div><h3>FAQ</h3><p>Pertanyaan umum tentang istilah dan alur ERP.</p></a>
 </div></div>`
},
"/guide": {
 title:"Guide Awal",
 eyebrow:"Getting Started",
 intro:"Gunakan guide ini sebelum masuk ke detail menu. Tujuannya agar Anda memahami konteks setiap data yang muncul di aplikasi.",
 body:`
 <div class="section"><h2>1. Pahami alur bisnis</h2><p>Order menentukan apa yang harus diproduksi. MRP menentukan material yang dibutuhkan. Purchase melakukan pembelian material. Setelah supplier mengirim barang, Inventory mencatat penerimaan dan mengelola stock.</p>
 <div class="flow"><span>Buyer</span><span class="arrow">→</span><span>Order</span><span class="arrow">→</span><span>MRP</span><span class="arrow">→</span><span>Purchase</span><span class="arrow">→</span><span>Receive / GRN</span><span class="arrow">→</span><span>QC</span><span class="arrow">→</span><span>Stock</span><span class="arrow">→</span><span>Issue</span></div></div>
 <div class="section"><h2>2. Cara menggunakan halaman modul</h2>
 <div class="step"><div class="step-num">1</div><div><h4>Pahami fungsi menu</h4><p>Baca bagian "Apa itu" sebelum membuka aplikasi.</p></div></div>
 <div class="step"><div class="step-num">2</div><div><h4>Pelajari field</h4><p>Perhatikan Order Number, PO Number, Article, Color, Size, Quantity, dan field lain yang muncul.</p></div></div>
 <div class="step"><div class="step-num">3</div><div><h4>Praktik di aplikasi</h4><p>Gunakan area screenshot sebagai tempat dokumentasi. Masukkan screenshot aplikasi yang sesuai pada setiap langkah.</p></div></div>
 <div class="step"><div class="step-num">4</div><div><h4>Cocokkan dengan alur</h4><p>Setelah mencoba satu menu, pahami menu sebelum dan sesudahnya dalam flow.</p></div></div></div>
 <div class="section"><h2>3. Template screenshot pembelajaran</h2><div class="screenshot"><div><strong>SCREENSHOT APLIKASI</strong><small>Letakkan screenshot aplikasi asli di area ini. Tambahkan caption, nomor langkah, dan penjelasan field yang terlihat.</small></div></div></div>`
},
"/order": {
 title:"Order",
 eyebrow:"Module 01",
 intro:"Order berisi pesanan dari buyer dan menjadi dasar untuk proses selanjutnya. Setiap order menggunakan SPI atau Surat Pesanan Internal.",
 body:moduleOverview("Order",["Order Entry Detail","Assortment","PO Buyer","Destination","Ship Date","Style","Color","Size"],"Order dibuat di departemen Central Planning. Sebelum order diproses, terdapat proses costing untuk menemukan kebutuhan harga berdasarkan permintaan buyer."),
},
"/mrp": {
 title:"MRP",
 eyebrow:"Module 02",
 intro:"MRP atau Material Requirements Planning digunakan untuk mengetahui material yang dibutuhkan berdasarkan order produksi.",
 body:moduleOverview("MRP",["RM Specification","Consumption","Fabric & Trims","Article","Color","Size"],"BOM menjadi salah satu dasar proses MRP. BOM berisi daftar material, quantity, dan spesifikasi unit material yang diperlukan."),
},
"/purchase": {
 title:"Purchase",
 eyebrow:"Module 03",
 intro:"Purchase digunakan setelah angka consumption tersedia sehingga kebutuhan material dapat dihitung dan proses pembelian dilakukan.",
 body:moduleOverview("Purchase",["RM Purchase","BOM","Regular","Combined","General","Domestic","Import"],"Purchase memiliki jenis Regular, Combined, dan General. Pembelian juga dibedakan menjadi Domestic dan Import."),
},
"/inventory": {
 title:"Inventory",
 eyebrow:"Module 04",
 intro:"Inventory menyimpan dan mengelola material yang tersedia di gudang. Material dapat dikelola berdasarkan roll dan lokasi penyimpanannya.",
 body:moduleOverview("Inventory",["RM Receive / GRN","QC","RM Issue","RM Roll Wise","RM Rack Wise","Stock Report"],"Material yang diterima masuk ke proses QC. Material yang good dapat menjadi stock. Material reject dapat dikembalikan ke supplier."),
},
"/order-entry-detail": item("Order Entry Detail","Order","Berisi informasi utama mengenai order. Gunakan menu ini untuk memahami data dasar yang menjadi referensi proses berikutnya.","Order Number, Buyer, Order Quantity, Ship Date, dan informasi order lainnya."),
"/assortment": item("Assortment","Order","Menunjukkan pembagian atau variasi order berdasarkan style, color, size, dan quantity.","Style, Color, Size, Quantity."),
"/po-buyer": item("PO Buyer","Order","Berisi Purchase Order dari buyer yang menjadi salah satu referensi untuk mengetahui kebutuhan order.","Buyer, PO, Order, dan detail pesanan."),
"/destination": item("Destination","Order","Menunjukkan lokasi tujuan pengiriman barang. Buyer dan destination dapat berbeda.","Contoh: buyer berada di Inggris, tetapi barang dikirim ke Brazil."),
"/ship-date": item("Ship Date","Order","Menunjukkan tanggal pengiriman yang ditentukan.","Ship Date menjadi acuan waktu pengiriman sesuai order."),
"/style-color-size": item("Style, Color & Size","Order","Style menunjukkan model atau identitas garment. Color menunjukkan warna. Size menunjukkan ukuran. Ketiganya dapat membentuk identitas variasi garment.","Contoh style dapat menggunakan kode tertentu. Color dapat memiliki kode, misalnya Pink Light dengan kode 51-304."),
"/rm-spec": item("RM Specification","MRP","Digunakan untuk melihat spesifikasi raw material seperti article, color, position, dan consumption.","Material tidak cukup diidentifikasi hanya berdasarkan warna. Article dan color digunakan untuk membedakan material."),
"/consumption": item("Consumption","MRP","Menunjukkan kebutuhan material untuk membuat satu unit produk. Angka ini digunakan untuk menghitung kebutuhan per order.","Contoh: 0.1338 yard/pcs × 1.540 pcs = 206.052 yard."),
"/fabric-trims": item("Fabric & Trims","MRP","Material dibagi menjadi Fabric dan Trims. Fabric adalah kain. Trims adalah material aksesoris atau pendukung.","Contoh trims: benang, label, renda, strap, foam cup."),
"/article": item("Article","MRP","Article menjadi identitas penting untuk membedakan suatu fabric. Setelah article diketahui, material dibedakan lagi berdasarkan color.","Contoh: Article Fabric A + Color Black berbeda dengan Article Fabric A + Color White."),
"/rm-purchase": item("RM Purchase","Purchase","Digunakan untuk proses pembelian raw material setelah kebutuhan material diketahui.","Data dapat berkaitan dengan supplier, buyer, order number, material, quantity, currency, dan PO number."),
"/bom": item("BOM","MRP / Purchase","Bill of Material berisi daftar material yang diperlukan untuk membuat suatu produk. BOM mencantumkan material, quantity, dan spesifikasi.","BOM menjadi salah satu dasar dalam proses MRP."),
"/regular-combined": item("Regular & Combined","Purchase","Regular menggunakan SPI sebagai acuan karena sifatnya spesifik. Combined digunakan ketika beberapa kebutuhan dapat digabung dalam satu pembelian.","Regular memiliki satu acuan SPI. Combined dapat memiliki beberapa SPI."),
"/domestic-import": item("Domestic & Import","Purchase","Purchase dibedakan berdasarkan sumber supplier. Domestic digunakan untuk supplier lokal. Import digunakan untuk supplier luar negeri.","Kode P menunjukkan lokal dan I menunjukkan internasional."),
"/rm-receive": item("RM Receive / GRN","Inventory","Digunakan untuk mencatat material yang diterima dari supplier. Proses ini disebut GRN atau Raw Material Received.","PO Number, SPI, Material, Quantity, dan informasi penerimaan lainnya."),
"/qc": item("QC","Inventory","Setelah material diterima, QC memeriksa material. Hasil pemeriksaan dapat dibagi menjadi Good dan Reject.","Good masuk ke stock. Reject dapat dikembalikan ke supplier. Nomor GRN menjadi salah satu referensi QC."),
"/rm-issue": item("RM Issue","Inventory","Material Issue berarti material dikeluarkan dari inventory untuk digunakan dalam proses produksi.","Alur: Stock → Issue → Production."),
"/rm-rollwise": item("RM Roll Wise","Inventory","Digunakan untuk mengelola material yang disimpan dalam bentuk roll, terutama fabric.","Material yang diterima dapat dipecah menjadi beberapa roll. Setiap roll memiliki detail dan nomor tertentu."),
"/rm-rackwise": item("RM Rack Wise","Inventory","Digunakan untuk membantu pengelolaan material berdasarkan lokasi penyimpanan di gudang.","Fokus pada lokasi penyimpanan material."),
"/stock-report": item("Stock Report","Inventory","Digunakan untuk melihat informasi stock material yang tersedia di inventory.","Dapat digunakan untuk monitoring material, quantity, status, dan informasi stock lainnya.")
};

function moduleOverview(name, menus, desc){
 return `<div class="section"><h2>Fungsi</h2><p>${desc}</p><h2>Menu dalam modul</h2><div class="grid">${menus.map((m,i)=>`<a class="card" href="#/${slug(m)}"><div class="icon">${String(i+1).padStart(2,"0")}</div><h3>${m}</h3><p>Buka panduan dan area praktik aplikasi.</p></a>`).join("")}</div></div>
 <div class="section"><h2>Area praktik aplikasi</h2><p class="muted">Masukkan screenshot aplikasi pada halaman menu terkait. Setiap screenshot sebaiknya diberi penjelasan field dan langkah penggunaan.</p><div class="screenshot"><div><strong>SCREENSHOT MODUL ${name.toUpperCase()}</strong><small>Placeholder untuk screenshot aplikasi asli.</small></div></div></div>`;
}
function item(title,module,desc,detail){
 return {title,eyebrow:module,intro:desc,body:`<div class="section"><h2>Apa itu ${title}?</h2><p>${desc}</p><div class="callout"><b>Data yang perlu diperhatikan</b><br>${detail}</div></div><div class="section"><h2>Cara mempelajari di aplikasi</h2><div class="step"><div class="step-num">1</div><div><h4>Buka menu ${title}</h4><p>Gunakan menu ${title} pada aplikasi sesuai modul ${module}.</p></div></div><div class="step"><div class="step-num">2</div><div><h4>Identifikasi data</h4><p>Periksa field yang tersedia dan hubungkan dengan proses ERP yang sedang dipelajari.</p></div></div><div class="step"><div class="step-num">3</div><div><h4>Dokumentasikan screenshot</h4><p>Ambil screenshot setelah menemukan tampilan yang sesuai.</p></div></div><div class="screenshot"><div><strong>SCREENSHOT APLIKASI</strong><small>Letakkan screenshot aktual di sini. Tambahkan caption: "Gambar X. Tampilan ${title} pada aplikasi".</small></div></div></div><div class="section"><h2>Catatan proses</h2><p>Hubungkan data pada menu ini dengan menu sebelum dan sesudahnya. Gunakan halaman modul untuk memahami konteksnya.</p></div>`};
}
function slug(s){return s.toLowerCase().replace(/&/g,"and").replace(/[/]/g,"-").replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");}

pages["/faq"]={title:"FAQ",eyebrow:"Reference",intro:"Pertanyaan umum untuk membantu memahami istilah dan hubungan antar modul.",body:`<div class="section">
<div class="qa"><b>Apa hubungan Order dan MRP?</b><p>Order menunjukkan apa yang harus diproduksi. MRP digunakan untuk menentukan material yang diperlukan.</p></div>
<div class="qa"><b>Kapan Purchase dilakukan?</b><p>Setelah angka consumption tersedia, kebutuhan material dapat dihitung dan proses purchasing dilakukan.</p></div>
<div class="qa"><b>Apa perbedaan Regular dan Combined?</b><p>Regular menggunakan SPI sebagai acuan. Combined digunakan ketika beberapa kebutuhan dapat digabung dalam satu pembelian dan dapat memiliki beberapa SPI.</p></div>
<div class="qa"><b>Apa perbedaan Domestic dan Import?</b><p>Domestic digunakan untuk pembelian dari supplier lokal. Import digunakan untuk supplier luar negeri.</p></div>
<div class="qa"><b>Apakah quantity GRN selalu sama dengan PO?</b><p>Tidak. Supplier dapat mengirim material secara parsial. Sistem mencatat quantity yang benar-benar diterima pada setiap proses receive.</p></div>
<div class="qa"><b>Apa yang terjadi setelah material diterima?</b><p>Material masuk ke QC. Material Good dapat masuk stock. Material Reject dapat dikembalikan kepada supplier.</p></div>
</div>`};

function render(){
 const route=location.hash.replace("#","")||"/";
 const page=pages[route]||pages["/"];
 document.getElementById("app").innerHTML=`<div class="hero"><div class="eyebrow">${page.eyebrow}</div><h1>${page.title}</h1><p>${page.intro}</p></div>${page.body}`;
 document.querySelectorAll("nav a").forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+route));
 window.scrollTo({top:0});
}
window.addEventListener("hashchange",render); render();

document.getElementById("menuBtn").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
document.getElementById("themeBtn").onclick=()=>document.documentElement.classList.toggle("dark");

const searchInput=document.getElementById("searchInput"), panel=document.getElementById("searchPanel");
const index=Object.entries(pages).map(([route,p])=>({route,title:p.title,text:(p.title+" "+p.intro+" "+p.body.replace(/<[^>]+>/g," ")).toLowerCase()}));
searchInput.addEventListener("input",()=>{
 const q=searchInput.value.trim().toLowerCase();
 if(!q){panel.style.display="none";return}
 const results=index.filter(x=>x.text.includes(q)).slice(0,10);
 panel.innerHTML=results.length?results.map(x=>`<a class="search-result" href="#${x.route}"><b>${x.title}</b><small>${x.route}</small></a>`).join(""):`<div class="search-result">Tidak ada hasil.</div>`;
 panel.style.display="block";
});
document.addEventListener("click",e=>{if(!panel.contains(e.target)&&e.target!==searchInput)panel.style.display="none"});
