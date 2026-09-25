# Modul ProMan Manual - Ringkasan dalam Bahasa Indonesia

## 1. Pendahuluan

ProMan (Production Management) adalah sistem manajemen produksi dan ERP yang digunakan untuk mengelola alur kerja dari penerimaan order buyer hingga pengiriman barang ke customer. Dalam sistem ini, setiap proses saling terkait dan harus dikelola secara tertib agar produksi berjalan sesuai target, kebutuhan material tersedia, serta barang dapat dikirim tepat waktu.

Manual ProMan berfokus pada pengelolaan siklus produksi garment, mulai dari:

- Order dari buyer
- Perencanaan kebutuhan material (MRP)
- Pembelian material
- Penerimaan dan pengelolaan stok
- Proses produksi
- Pengemasan dan pengiriman
- Monitoring laporan dan kontrol operasional

Dokumen ini dibuat sebagai ringkasan materi modul yang dapat dipakai untuk pembelajaran, pelatihan, serta dokumentasi internal.

---

## 2. Alur Proses Utama dalam ProMan

Secara umum, alur kerja ProMan dapat digambarkan sebagai berikut:

Order -> MRP -> Purchase -> Inventory -> Production -> Shipment -> Reporting

Berikut penjelasan singkat tiap tahapan:

1. Order
   - Buyer mengajukan pesanan produk.
   - Data order mencakup buyer, quantity, style, size, destination, dan ship date.
   - Setiap order memiliki nomor SPI (Surat Pesanan Internal) sebagai identitas utama.

2. MRP
   - Sistem menghitung kebutuhan material berdasarkan order yang masuk.
   - Data BOM (Bill of Material) digunakan untuk menentukan material yang dibutuhkan.
   - Material utama seperti fabric dan trims direncanakan secara tepat.

3. Purchase
   - Setelah kebutuhan material diketahui, dilakukan pembelian dari supplier lokal atau import.
   - Terdapat jenis purchase regular, combined, dan general.

4. Inventory
   - Material yang diterima dari supplier masuk ke gudang.
   - Proses mencakup penerimaan, QC, good/ reject, issue, stock, dan laporan gudang.

5. Production
   - Material yang sudah disediakan masuk ke proses produksi seperti cutting, sewing, dan packing.

6. Shipment
   - Produk jadi yang siap dikirim dipersiapkan untuk ekspor/ pengiriman sesuai target buyer.

7. Reporting
   - Semua hasil proses dicatat dan dilaporkan untuk evaluasi performa produksi.

---

## 3. Modul 1 - Order

### Tujuan
Modul Order berfungsi sebagai titik awal dari seluruh alur produksi. Semua informasi penting tentang pesanan buyer tercatat di sini sebagai dasar proses berikutnya.

### Komponen utama
- Order Number / SPI
- Buyer
- Order date
- Order quantity
- Ship date
- Destination
- Style
- Color
- Size
- Assortment
- Buyer PO

### Penjelasan
- SPI (Surat Pesanan Internal) adalah nomor identitas order internal yang digunakan dalam seluruh proses.
- Contoh format SPI: 2B/2026/HBI/1821
  - 2B = unit
  - 2026 = tahun order
  - HBI = buyer
  - 1821 = nomor urut order
- Assortment adalah pembagian pesanan berdasarkan style, color, size, dan quantity.
- Buyer PO adalah Purchase Order dari buyer yang menjadi acuan produksi.
- Destination adalah tujuan pengiriman barang, yang bisa berbeda dengan lokasi buyer.

### Manfaat modul Order
- Menjadi sumber data utama untuk produksi
- Memudahkan pelacakan order
- Menjamin semua departemen bekerja berdasarkan order yang sama
- Menjadi dasar perhitungan kebutuhan material dan jadwal produksi

---

## 4. Modul 2 - MRP (Material Requirement Planning)

### Tujuan
MRP bertujuan menghitung kebutuhan material produksi berdasarkan order yang sudah masuk, sehingga material tersedia tepat waktu dan jumlahnya sesuai kebutuhan.

### Konsep penting
- BOM (Bill of Material): daftar material yang dibutuhkan untuk membuat produk.
- Fabric: material utama seperti kain.
- Trims: material pendukung seperti benang, label, lace, strap, foam cup, dan aksesori lain.
- RM Specification: data spesifikasi material, article, color, position, dan konsumsi.
- Consumption: kebutuhan material per satu unit produk.

### Contoh perhitungan konsumsi
Jika consumption material per pcs adalah 0.1338 yard dan order quantity adalah 1.540 pcs, maka kebutuhan total adalah:

0.1338 x 1.540 = 206.052 yard

Artinya, kebutuhan material dapat dihitung dengan tepat berdasarkan kuantitas order dan spesifikasi material.

### Langkah kerja umum
1. Buka menu MRP
2. Pilih Specifications
3. Klik View
4. Tekan F8 untuk filter berdasarkan SPI atau PO
5. Pilih SPI tertentu
6. Pilih jenis material: Fabric atau Trims

### Manfaat modul MRP
- Menghindari kekurangan material
- Mengurangi pemborosan
- Menjaga keseimbangan antara kebutuhan produksi dan stok tersedia
- Menjadi dasar penyusunan purchase plan

---

## 5. Modul 3 - Purchase

### Tujuan
Modul Purchase digunakan untuk membeli kebutuhan material setelah MRP menentukan kebutuhan yang harus dipenuhi.

### Jenis purchase
- Domestic: pembelian dari supplier lokal
- Import: pembelian dari supplier luar negeri
- Regular: pembelian terkait satu SPI tertentu
- Combined: beberapa kebutuhan atau SPI digabung dalam satu PO
- General: kebutuhan umum yang tidak terkait langsung dengan SPI tertentu

### Karakteristik data purchase
Data purchase biasanya mencakup:
- supplier
- buyer
- order number
- material
- quantity
- currency
- PO number

### Contoh kombinasi purchase
Jika SPI 001 membutuhkan Fabric A, SPI 002 membutuhkan Fabric B, dan SPI 003 membutuhkan Fabric C, maka kebutuhan tersebut dapat digabung menjadi satu proses purchase yang lebih efisien.

### Manfaat modul Purchase
- Memastikan material tersedia tepat waktu
- Mengendalikan pembelian sesuai kebutuhan
- Mengoptimalkan biaya dan supplier
- Menjaga hubungan kerja dengan supplier

---

## 6. Modul 4 - Inventory

### Tujuan
Inventory berfungsi untuk menerima, menyimpan, mengeluarkan, dan memonitor material dari supplier hingga dipakai untuk produksi.

### Alur umum inventory
Supplier -> Receive / GRN -> QC -> Good -> Stock

Jika material ditolak, maka alurnya menjadi:

Supplier -> Receive / GRN -> QC -> Reject -> Return to Supplier

### Komponen utama
- RM Receive / GRN
- QC
- RM Issue
- Roll Wise
- Rack Wise
- Stock Report

### RM Receive / GRN
GRN (Goods Receipt Note) adalah catatan penerimaan material dari supplier. Data yang dicatat biasanya meliputi:
- PO Number
- SPI
- Material
- Quantity
- Tanggal penerimaan
- Status penerimaan

Contoh: material foam cup dengan PO 1.800 pcs dapat diterima bertahap. Penerimaan pertama 500 pcs tercatat, sementara sisanya masih pending.

### RM Issue
Material yang sudah masuk stock kemudian dikeluarkan untuk kebutuhan produksi.

Alurnya:

Stock -> Issue -> Production

### Roll Wise dan Rack Wise
- Roll Wise digunakan terutama untuk material berbentuk roll seperti kain.
- Rack Wise menunjukkan lokasi penyimpanan material di rak.

### Stock Report
Laporan stok digunakan untuk melihat:
- material yang tersedia
- jumlah per stock
- status material
- lokasi penyimpanan

### Manfaat modul Inventory
- Mengontrol material masuk dan keluar
- Menjaga keakuratan stok
- Mengurangi kehilangan material
- Menjamin material siap dipakai saat produksi dimulai

---

## 7. Modul 5 - Production

### Tujuan
Modul Production digunakan untuk mengelola proses pembuatan produk dari material yang sudah tersedia.

### Proses produksi umum
Pada garment, proses produksi biasanya meliputi:
- Cutting
- Sewing
- Packing

### Fungsi modul production
- Menjaga aliran kerja produksi berdasarkan order
- Mengendalikan material yang dikeluarkan untuk proses produksi
- Memantau progress pekerjaan di tiap tahap
- Menjaga kesesuaian output dengan target order

### Output produksi
Hasil proses produksi biasanya berupa barang jadi yang siap dikirim atau dipersiapkan untuk tahap berikutnya.

### Manfaat modul Production
- Mengendalikan kapasitas produksi
- Menjaga kualitas hasil produksi
- Mencegah keterlambatan pengerjaan
- Menyediakan data progress produksi untuk management

---

## 8. Modul 6 - Shipment

### Tujuan
Modul Shipment mengelola proses persiapan dan pengiriman produk jadi kepada buyer sesuai jadwal.

### Aktivitas utama
- Packing
- Pengaturan barang siap kirim
- Pengajuan kiriman / export
- Dokumentasi pengiriman
- Monitoring target ship date

### Fokus utama
- Menjaga produk jadi sesuai dengan destination
- Menjamin barang dikirim tepat waktu
- Menyelaraskan pengiriman dengan order buyer

### Manfaat modul Shipment
- Menjaga kepatuhan jadwal pengiriman
- Menurunkan risiko keterlambatan
- Memudahkan tracking kiriman
- Menjamin produk sampai di tujuan sesuai permintaan buyer

---

## 9. Reporting dan Monitoring

Modul reporting berfungsi untuk menampilkan dan menganalisis kinerja operasional dari sisi:
- order
- material kebutuhan
- pembelian
- stok gudang
- produksi
- pengiriman

Laporan ini sangat penting untuk:
- evaluasi performa harian atau bulanan
- identifikasi keterlambatan
- pengendalian biaya material
- memastikan semua departemen berjalan sesuai target

---

## 10. Istilah Penting (Glossary)

- SPI: Surat Pesanan Internal / Internal Order Letter
- Assortment: Pembagian order berdasarkan style, color, size, dan quantity
- Buyer PO: Purchase order dari buyer
- Destination: Lokasi tujuan pengiriman
- Ship Date: Tanggal pengiriman yang dijanjikan
- BOM: Bill of Material, daftar material yang dibutuhkan
- Fabric: Bahan utama produk seperti kain
- Trims: Aksesoris pendukung produk
- Consumption: Kebutuhan material per satu unit produk
- GRN: Goods Receipt Note, catatan penerimaan barang
- QC: Quality Control, pemeriksaan kualitas
- RM Issue: Pengeluaran material dari stok ke produksi
- Roll Wise: Sistem pengelolaan material berdasarkan roll
- Rack Wise: Sistem pengelolaan material berdasarkan rak penyimpanan

---

## 11. Kesimpulan

Manual ProMan mengajarkan bahwa sistem produksi tidak hanya berfokus pada pembuatan produk, tetapi juga pada pengelolaan data, material, jadwal, stok, proses produksi, dan pengiriman. Setiap modul memiliki peran penting dan saling berhubungan.

Kesuksesan produksi sangat bergantung pada:
- akurasi data order
- perencanaan material yang tepat
- pengelolaan purchase yang efektif
- pengendalian stock dan QC
- proses produksi yang terkontrol
- pengiriman yang sesuai jadwal

Dengan memahami tiap modul secara berurutan, pengguna dapat mengoperasikan ProMan secara efektif dan menjaga kelancaran produksi secara keseluruhan.

---

## 12. Daftar Modul ERP yang Tersedia dalam Project

Project ini mencakup modul utama berikut:

- Order
- MRP
- Purchase
- Inventory
- Production
- Shipment
- Reporting / Web Report
- Administration / CMS

Semua modul tersebut membentuk ekosistem knowledge base yang mendukung dokumentasi kerja dan pembelajaran operasional ERP.

---

## 13. Catatan

Dokumen ini disusun berdasarkan struktur manual ProMan dan alur modul ERP yang terlihat pada project ini. Jika file PDF manual ProMan tersedia di kemudian hari, dokumen ini dapat diperbarui dan disesuaikan lebih lanjut agar lebih akurat sesuai versi manual resmi.
