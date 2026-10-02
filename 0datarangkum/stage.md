Stage

Order
Order berisi pesanan dari buyer yang menjadi dasar untuk proses selanjutnya. Masing masing order memiliki nomor SPI - Surat Pesanan Internal.
Order Entry Detail
Berisi informasi utama mengenai order.
Informasi yang dapat dilihat antara lain
Order number
Buyer
Order Date
Order Quantity
Ship date
Informasi order lainnya
	Contoh format order number / SPI = 2B/2026/HBI/1821
	Keterangan : 
2B menunjukkan unit
2026 menunjukkan tahun order
HBI menunjukkan buyer
1821 menunjukkan nomor urut order
	Assortment digunakan untuk melihat pembagian order berdasarkan style, color, size, quantity


PO Buyer berisi purchase order dari buyer, menjadi referensi utama untuk mengetahui produk yang harus diproduksi dan kebutuhan order.
Destination menunjukkan lokasi tujuan pengiriman barang. Buyer dan destination tidak selalu berada di lokasi yang sama.
Contoh Buyer -> Inggris, Destination -> Brazil. Artinya buyer berasal dari Inggris, tetapi barang dikirim ke Brazil.
Ship date menunjukkan tanggal barang harus dikirim sesuai permintaan buyer.
Style menunjukkan model atau identitas garmen dari masing-masing buyer
*


Color menunjukkan warna produk atau material. Color dapat memiliki kode tertentu.
Size menunjukkan ukuran produk.
*

MRP
MRP adalah kepanjangan dari Material Requirement Planning, sistem digital yang merencanakan kebutuhan material produksi secara akurat. Digunakan untuk menentukan material yang dibutuhkan berdasarkan order produksi.

BOM Menjadi salah satu dasar dalam proses MRP. BOM berisi material yang dibutuhkan, jumlah, dan spesifikasi material.
Material dibagi menjadi
Fabric, yaitu kain
Trims, yaitu material pendukung seperti benang, label, renda, strap foam cup dan material sejenisnya
Terdapat RM Specifications, digunakan untuk melihat spesifikasi raw material
Informasi dapat mencakup : 
Material
Article
Color
Size
Position
Consumption
	Fabric & Trims
Material dalam proses MRP dibagi menjadi Fabric dan Trims.
Fabric digunakan sebagai material utama garment.
Trims digunakan sebagai material pendukung.
Contoh trims:
• Benang
• Label
• Renda
• Strap
• Foam cup

Article menjadi identitas penting untuk membedakan material. Setelah article diketahui, material dapat dibedakan lagi berdasarkan color.
Contoh:
Article = DPO-05000-15R
Color = Black
Position = Armhole
	Consumption menunjukkan kebutuhan material untuk membuat satu unit produk.
	Contoh =
	Consumption = 0.1338 yard/pcs
	Jika order quantity = 1540 pcs
	1540 X 0.1338 = 206.052 yard
	Jadi kebutuhan material untuk order tersebut adalah 206.052 yard
Color menunjukkan warna material yang digunakan. Material dengan article yang sama dapat memiliki color yang berbeda.
Size digunakan untuk menentukan kebutuhan material berdasarkan ukuran produk.
Consumption dapat berbeda tergantung size yang digunakan.


Raw Material Specifications dan consumption. Dapat dilihat di menu MRP -> Specifications -> F8 untuk filter

Menu MRP


Klik Specifications

Ada pilihan untuk Add, Modify, View. Klik VIew

Lalu bisa pilih F8 untuk filter berdasarkan SPI atau nomor PO

Contoh mengambil berdasarkan SPI /HBI/1821, lalu klik -> Bisa memilih Fabric/Trims

Hasil pencarian

Purchase
Purchase digunakan untuk melakukan pembelian material setelah kebutuhan material dari MRP sudah diketahui.Setelah consumption tersedia, perusahaan dapat menghitung kebutuhan material dan melakukan purchasing. 

Purchase dibagi berdasarkan:
• Domestic
• Import

Dan terdapat beberapa jenis purchase:
• Regular
• Combined
• General


buka menu Purchase


ada pilihan Domestik/import

tampilan jika memilih domestik


tampilan jika memilih import

RM Purchase digunakan untuk melakukan pembelian raw material.Data purchase dapat berkaitan dengan:
• Supplier
• Buyer
• Order Number
• Material
• Quantity
• Currency
• PO Number
BOM atau Bill of Material berisi daftar material yang diperlukan untuk membuat suatu produk.
BOM mencantumkan material, quantity, dan spesifikasi material.
Contoh:
Produk membutuhkan:
• Fabric A
• Fabric B
• Thread
• Label
BOM membantu menentukan material yang perlu disiapkan untuk produksi. 
Regular digunakan ketika pembelian material berkaitan dengan satu SPI tertentu. SPI menjadi acuan dalam pembuatan PO. Nomor SPI dapat terlihat langsung pada PO. 


Regular purchase

Combined digunakan ketika beberapa kebutuhan material digabung dalam satu pembelian. Satu PO Combined dapat memiliki beberapa SPI. 
Contoh:
SPI 001 → Fabric A
SPI 002 → Fabric B
SPI 003 → Fabric C
Ketiga kebutuhan tersebut dapat digabung dalam satu proses purchase.


Combined Purchase

General digunakan untuk kebutuhan yang sifatnya lebih umum dan tidak berkaitan langsung dengan SPI tertentu. 


General Purchase

Domestic digunakan untuk pembelian material dari supplier lokal atau dalam Indonesia.
Import digunakan untuk pembelian material dari supplier luar negeri.
Purchase juga menggunakan kode tertentu untuk membedakan sumber material. Kode P menunjukkan lokal dan I menunjukkan internasional. 

Inventory digunakan untuk menyimpan dan mengelola material yang sudah diterima di gudang.
Material yang sudah lolos QC dapat masuk ke stock inventory. Inventory juga mengelola material berdasarkan roll dan lokasi penyimpanan. 
Alur sederhananya:
Supplier → Receive/GRN → QC → Good → Stock
Jika material ditolak:
Supplier → Receive/GRN → QC → Reject → Return to Supplier 
RM Receive digunakan untuk mencatat material yang diterima dari supplier. Saat melakukan receive, user memasukkan:
• PO Number
• SPI
• Material
• Quantity
• Informasi penerimaan lainnya
Proses penerimaan material disebut GRN atau Raw Material Received. Quantity yang diterima dapat berbeda dari quantity pada PO.



Berikut contoh dari regular po yang sama yang sudah received, terdapat GRN no yaitu 2026/Y2/IDMP/F4429, kalau GRN nya IDMP artinya itu dari supplier ke gudang. kalau dari gudang ke SPI, maka kodenya jadi ODPD, itu artinya issued.


Sama dengan item tadi sudah received 219 yards

Quantity yang diterima tidak selalu sama dengan quantity pada PO. Contohnya PO foam cup = 1.800 pcs, pengiriman pertama = 500 pcs. Maka sistem mencatat 500 pcs sebagai quantity yang sudah diterima dan sisanya masih pending. Supplier dapat mengirim material secara parsial. Gudang kemudian melakukan receive setiap kali material datang.

Contoh:
PO = 1.800 pcs
Pengiriman pertama = 500 pcs
Maka sistem mencatat 500 pcs sebagai quantity yang sudah diterima. Sisa quantity masih pending dan supplier dapat mengirimkannya secara bertahap. 
RM Issue digunakan untuk mengeluarkan material dari inventory untuk kebutuhan produksi.
Alurnya:
Stock → Issue → Production
Material yang sudah tersedia di inventory dapat dikeluarkan ketika dibutuhkan oleh proses produksi. 

Issue

RM Roll Wise digunakan untuk mengelola material yang disimpan dalam bentuk roll, terutama fabric.
Material yang diterima dapat dipecah menjadi beberapa roll.
Setiap roll memiliki informasi dan nomor masing-masing. 
Contoh:
Received Fabric = 1.000 yard
Kemudian disimpan menjadi:
Roll 001 = 400 yard
Roll 002 = 350 yard
Roll 003 = 250 yard
RM Rack Wise digunakan untuk mengetahui lokasi penyimpanan material di gudang.Data ini membantu user mengetahui material disimpan di rack mana.RM Roll Wise fokus pada detail roll.RM Rack Wise fokus pada lokasi penyimpanan.
Stock Report digunakan untuk melihat informasi stock material.
Informasi yang dapat digunakan untuk monitoring antara lain:
• Material
• Quantity
• Status stock
• Lokasi penyimpanan
• Informasi inventory lainnya

Cutting
Sewing
Packing
Inventory FG
Shipment
Reporting
Web Report
