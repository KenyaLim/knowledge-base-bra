
Modul **Packing** digunakan untuk mengatur proses pengepakan garment mulai dari menentukan metode packing, membuat packing slip, memasukkan garment ke carton, sampai menghasilkan packing list untuk kebutuhan pengiriman. 

## 1. Packing Chart

Packing Chart menentukan **bagaimana quantity order akan dikemas**.

Terdapat 3 metode utama:

* **Ratio Packing**

  * Satu carton berisi kombinasi warna dan ukuran berdasarkan ratio tertentu.
  * Contoh: setiap carton berisi 2 pcs dari setiap kombinasi warna/size. 

* **Solid Color / Assorted Size**

  * Satu carton menggunakan satu warna.
  * Di dalamnya terdapat beberapa ukuran.

* **Solid Color / Solid Size**

  * Satu carton menggunakan satu warna dan satu ukuran.
  * Metode ini dibuat setelah jenis packing lainnya selesai karena menghitung seluruh quantity yang masih tersisa. 

Alur sederhananya:

```text
Buyer PO
   ↓
Packing Chart
   ↓
Tentukan metode packing
   ↓
Tentukan carton & quantity
```

---

## 2. Pre-pack Chart

Pre-pack digunakan ketika garment **dikemas terlebih dahulu dalam inner carton, blister bag, atau kemasan kecil** sebelum dimasukkan ke carton utama. 

Yang dapat ditentukan:

* Pcs per pre-pack
* Warna
* Size
* Carton
* Pre-pack number
* Tipe pre-pack

Tipe yang tersedia:

* Pre-pack
* Bulk-pack
* Multi-pack
* Case-pack

Sistem dapat membuat nomor pre-pack secara otomatis. 

---

# 3. Packing Slip

Packing Slip merupakan **realisasi dari Packing Chart**.

Karena quantity aktual baru diketahui setelah proses finishing, Packing Slip dibuat setelah quantity aktual tersedia. 

Mode yang tersedia:

| Mode   | Fungsi                 |
| ------ | ---------------------- |
| Add    | Membuat Packing Slip   |
| Modify | Mengubah Packing Slip  |
| View   | Melihat Packing Slip   |
| Delete | Menghapus Packing Slip |
| Print  | Mencetak Packing Slip  |

Packing Slip dapat dibuat berdasarkan:

* Satu Buyer PO
* Beberapa Buyer PO
* Jenis packing tertentu
* Seluruh chart

Sistem juga dapat membuat nomor carton secara otomatis dengan:

* Prefix
* Starting carton number
* Suffix

---

# 4. Modify Packing Slip

Packing Slip yang sudah dibuat masih dapat disesuaikan.

Informasi yang dapat diubah antara lain:

* Range carton
* Jumlah pcs per size
* Carton dimension
* Color
* Carton weight
* Net weight
* Net-net weight
* SKU
* Assortment ID
* Item ID
* Item number 

Dimensi carton dapat dimasukkan berdasarkan:

```text
Length × Breadth × Height
```

Volume carton atau **MEAST** kemudian dihitung otomatis. 

---

# 5. Pre-pack Slip

Pre-pack Slip adalah realisasi dari **Pre-pack Chart**.

Fungsinya hampir sama dengan Packing Slip, tetapi digunakan untuk proses pre-pack.

Mode:

* Add
* Modify
* View
* Delete
* Print

Pre-pack Slip dapat dimodifikasi untuk:

* Pre-pack type
* Carton number
* Pre-pack number
* Color
* Pre-pack/carton
* Assortment per pack
* Menambah carton
* Menghapus carton 

---

# 6. Carton Packing

Setelah Packing Slip atau Pre-pack Slip dibuat, proses berikutnya adalah **Carton Packing**.

Tujuannya untuk menentukan carton yang benar-benar siap dikirim dan melengkapi informasi carton seperti:

* Carton dimension
* Gross weight
* Net weight
* Net-net weight
* Packed by
* Checked by



Carton dapat diberi status:

```text
Packed / Dipilih untuk Delivery
```

Terdapat beberapa aktivitas:

* Check
* Check All
* Uncheck
* Uncheck All
* Reset
* Reset All



---

# 7. Stock Validation

Carton Packing dapat dikaitkan dengan **ketersediaan stock**.

Jika parameter **Carton Packing Based on Inventory** aktif, sistem akan mengecek apakah stock untuk isi carton tersedia.

Jika stock tidak cukup, carton tidak dapat dipilih dan sistem memberikan peringatan. 

---

# 8. Automatic Weight Calculation

Berat carton dapat dihitung otomatis berdasarkan berat masing-masing garment.

Data yang digunakan:

```text
Garment
↓
Color
↓
Size
↓
Individual Weight
↓
Carton Weight
```

Perhitungannya:

```text
Net Weight
= jumlah pcs × garment net weight

Net Net Weight
= jumlah pcs × garment net-net weight

Gross Weight
= Net Weight + Carton Weight
```

Contoh dalam manual:

```text
5 pcs × 210 g = 1.050 kg Net Weight

5 pcs × 200 g = 1.000 kg Net-Net Weight

1.050 kg + 100 g carton
= 1.150 kg Gross Weight
```



---

# 9. Barcode

Carton dapat diproses menggunakan **barcode**.

Alurnya:

```text
Carton
 ↓
Generate Barcode
 ↓
Print Barcode
 ↓
Scan Barcode
 ↓
Carton otomatis terpilih
```

Barcode dapat digunakan untuk:

* Memilih carton untuk delivery
* Scan carton
* Scan individual garment
* Memastikan quantity tidak melebihi Packing Slip



---

# 10. Pallet

Beberapa carton dapat dikelompokkan ke dalam **Pallet**.

Alurnya:

```text
Carton
   ↓
Pallet
   ↓
Container
```

Pallet number dapat dibuat otomatis dan carton dimasukkan ke pallet menggunakan barcode scanning. 

---

# 11. Container Loading

Setelah carton atau pallet siap, proses berikutnya adalah memasukkannya ke **Container**.

Data yang digunakan:

* Container number
* Shipment date
* Pallet number atau carton number

Alurnya:

```text
Carton
   ↓
Pallet (optional)
   ↓
Container
   ↓
Shipment
```

Carton atau pallet dipilih dengan barcode scanning. 

---

# 12. Packing List Garment

Packing List dibuat setelah:

1. Invoice dibuat.
2. Carton Packing selesai.
3. Data packing tersedia.

Packing List mengambil carton yang sudah dipilih untuk delivery. 

Mode:

* Add
* Modify
* View
* Delete
* Print

Packing List juga dapat memilih:

* Semua carton
* Sebagian carton
* Range carton tertentu

---

# 13. Pre-pack List

Pre-pack List digunakan untuk order yang menggunakan **Pre-pack Slip** dan sudah melalui Carton Packing. 

Fungsinya:

* Membuat Pre-pack List
* Mengubah Pre-pack List
* Melihat Pre-pack List
* Menghapus Pre-pack List
* Print Pre-pack List

Container number juga dapat dimasukkan pada tahap ini. 

---

# 14. Packing SQLE

SQLE merupakan tool untuk mengambil data Packing dari order tertentu untuk kebutuhan **debugging dan analisis masalah**.

Data yang diekspor dapat dikirim ke pihak EcoTech untuk dianalisis. 

---

# 15. Fabric & Accessories Packing

Selain garment, modul Packing juga menangani **Fabric dan Accessories**.

Prosesnya:

```text
Fabric / Accessories Order
        ↓
Packing Slip
        ↓
Modify / View / Delete
        ↓
Print
```

Data yang dapat dimasukkan antara lain:

* Pack type
* Starting pack number
* Ending pack number
* Gross weight
* Net weight
* Tube weight
* Weight unit
* Packed quantity 

---

# 16. Fabric Packing List

Untuk fabric, Packing List dibuat melalui **Export → Packing List → Fabric Wise**.

Mode yang tersedia:

* Add
* Modify
* View
* Delete
* Print

Packing dapat dipilih seluruhnya atau berdasarkan range tertentu. 

---

# Alur Besar Modul Packing

Secara keseluruhan:

```text
ORDER
  │
  ├── Packing Chart
  │       │
  │       ├── Ratio Packing
  │       ├── Solid Color / Assorted Size
  │       └── Solid Color / Solid Size
  │
  └── Pre-pack Chart
          │
          ↓
   Packing Slip / Pre-pack Slip
          │
          ↓
      Carton Packing
          │
          ├── Weight
          ├── Dimension
          ├── Barcode
          └── Stock Validation
          │
          ↓
        Pallet
          │
          ↓
      Container Loading
          │
          ↓
      Packing List
          │
          ↓
       Shipment
```

## Struktur modul untuk Knowledge Base

Kalau modul ini nanti kamu masukkan ke website Knowledge Base yang sedang kamu buat, struktur navigasinya bisa dibuat seperti:

```text
Packing
│
├── Packing Chart
│   ├── Ratio Packing
│   ├── Solid Color / Assorted Size
│   └── Solid Color / Solid Size
│
├── Pre-pack Chart
│
├── Packing Slip
│   ├── Add
│   ├── Modify
│   ├── View
│   ├── Delete
│   └── Print
│
├── Pre-pack Slip
│
├── Carton Packing
│   ├── Carton Selection
│   ├── Weight
│   ├── Dimension
│   ├── Barcode
│   └── Stock Validation
│
├── Pallet
│
├── Container Loading
│
├── Packing List
│   └── Garment Wise
│
├── Pre-pack List
│
├── Fabric & Accessories Packing
│
├── Fabric Packing List
│
└── SQLE
```

**Intinya:** modul Packing mengelola proses dari **rencana pengepakan → realisasi packing → carton → pallet → container → packing list → shipment**, termasuk quantity, ukuran, berat, barcode, dan validasi stock.
