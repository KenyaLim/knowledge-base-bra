
Manual ini menjelaskan modul **Inventory Management** untuk mengelola material yang masuk dan keluar dari warehouse. Transaksi inventory pada dasarnya harus memiliki referensi **Material Purchase Order, Process Order, atau Work Order**. 

## Alur utama

```text
Purchase / Process / Work Order
          ↓
       GRN / DN
          ↓
    Quality Control
          ↓
     Active Stock
          ↓
 ┌────────┼─────────┐
 ↓        ↓         ↓
Issue    MTN      Location
 ↓        ↓
Process  Warehouse
          ↓
      Stock Reports
```

## 1. Issue / Receipt

Digunakan untuk membuat:

* **GRN (Goods Receipt Note)** untuk penerimaan barang.
* **DN (Delivery Note)** untuk pengeluaran barang.
* Return material.
* Vendor-to-vendor delivery.

GRN dapat digunakan untuk penerimaan finished goods maupun return raw material. Sistem memiliki validasi agar quantity penerimaan tidak melebihi quantity order, kecuali allowance diatur pada parameter Inventory.  

Jenis transaksi delivery/return:

1. Finished goods dari vendor → perusahaan.
2. Finished goods dari perusahaan → vendor.
3. Raw material dari perusahaan → processor.
4. Raw material dari vendor → perusahaan. 

### GRN

Saat membuat GRN, sistem dapat mencatat:

* Order reference.
* PO/WO.
* Material type.
* Warehouse.
* Vendor.
* Lot number.
* Declared quantity.
* Received quantity.
* Sender dan receiver.
* Invoice.
* Lorry Receipt.

GRN juga dapat melalui **GRN Approval** jika parameter tersebut diaktifkan. GRN yang belum disetujui tidak akan muncul di Quality Control.  

### DN

DN digunakan untuk mengeluarkan material dari warehouse menuju vendor atau proses berikutnya.

Sistem melakukan validasi terhadap:

* Active stock.
* QC breakup.
* Quantity yang boleh dikeluarkan.
* Raw material allowance.  

---

# 2. Quality Control

Semua barang yang masuk warehouse harus melalui **Quality Control** sebelum dapat digunakan untuk proses berikutnya. 

Status QC yang digunakan antara lain:

```text
Passed
Seconds
Rejected
Unchecked
```

QC dapat mencatat:

* Shade.
* Width.
* GSM.
* Quantity.
* Defect.
* Supplier debit.
* Rejection reason.

Quantity yang tidak sesuai antara declared, passed, rejected, dan seconds akan muncul sebagai **Shortage**. 

QC juga memiliki fitur **Transfer**, misalnya:

```text
Passed → Rejected
Passed → Seconds
Rejected → Passed
Seconds → Passed
```



---

# 3. QC & Bill Passing

Informasi QC dapat digunakan untuk melakukan debit kepada supplier atau processor.

Contohnya:

* QC rejection.
* Perubahan status stock.
* Raw material yang diberikan kepada processor.
* Excess billing.
* Fabric width debit.

Sistem dapat membuat debit advice secara otomatis apabila parameter **Automatic Raw Materials Debits Required** diaktifkan. 

---

# 4. QC Width Debits

Digunakan ketika **actual fabric width lebih kecil daripada ordered width**.

Sistem dapat menggunakan tolerance level per item pada PO. Jika actual width berada di bawah batas tolerance, sistem menghitung quantity atau nilai yang harus didebit kepada supplier. 

---

# 5. QC Reports

Report QC dapat ditampilkan berdasarkan:

* PO.
* GRN.
* QC completed.
* QC pending.
* QC not done.
* Stock.

Report dapat menunjukkan:

* Quantity received.
* QC completed.
* QC pending.
* Passed.
* Rejected.
* Seconds. 

---

# 6. QC Lab Testing

Material tertentu, khususnya fabric, dapat dikirim ke **lab testing** setelah masuk warehouse.

Alurnya:

```text
GRN
 ↓
Lab Issue
 ↓
Lab Testing
 ↓
Lab QC Result
 ↓
Quality Determination
```

Testing standard dapat dibuat berdasarkan buyer atau menggunakan standard umum melalui parameter sistem. 

---

# 7. Reorder Estimation

Inventory dapat menghitung kebutuhan **reorder** berdasarkan kekurangan atau penurunan kualitas material.

Faktor yang diperhitungkan antara lain:

* Shortage.
* Rejection.
* Seconds.
* Debit percentage.
* Width shortage.
* GSM excess.

Manual memberikan formula:

```text
Reorderable Quantity =
Shortage
+ Rejection
- Excess
+ Seconds × Debit %
+ Width Shortage
+ GSM Excess
```



Sistem juga memiliki pengaturan allowance berdasarkan:

* Material classification.
* Width.
* GSM/density.

Jika quantity yang perlu dipesan kembali melewati allowance BOM, sistem dapat memberikan prompt untuk melakukan reorder. 

---

# 8. Roll Wise Stock

Khusus untuk fabric, inventory dapat dikelola berdasarkan **roll**.

Setiap roll dapat memiliki:

* Roll number.
* Lot number.
* Quantity.
* Width.
* Shade.
* Defect.
* Barcode.
* QC status.

Barcode roll dapat digunakan saat material dikeluarkan. Roll yang sudah di-issue juga dapat digunakan oleh PROMAN. 

---

# 9. Fabric Rolls

Manual menyediakan fitur untuk memasukkan fabric rolls pada level:

```text
GRN Level
atau
QC Level
```

Jika menggunakan GRN Level, menu **Rolls Entry** tersedia untuk memasukkan roll satu per satu. Barcode roll dapat dibuat otomatis. 

Pada QC, setiap roll dapat diberikan informasi:

* Passed.
* Seconds.
* Rejected.
* Unchecked.
* Warp shrinkage.
* Weft shrinkage.
* Shade.
* Width.



---

# 10. Barcode Fabric Roll

Barcode digunakan di beberapa proses:

```text
GRN
 ↓
Roll Entry
 ↓
QC
 ↓
Roll Barcode
 ↓
Issue
 ↓
Production
```

Barcode label dapat dicetak pada beberapa tahap:

* GRN.
* QC.
* Piece Separation.
* Fabric Piecewise Stock Report.



Bahkan terdapat fitur **Offline Scanning**, yaitu barcode yang sudah discan dapat disimpan dalam text file kemudian di-import untuk menentukan roll yang akan di-issue. 

---

# 11. Item Master

**Item Master** digunakan untuk mengelola data item/material.

Informasi utama:

* Classification.
* Material name.
* Contents.
* Reference number.
* Color.
* Count.
* Specification.
* Reorder level.

Jika stock berada di bawah reorder level, sistem dapat memberikan alert. Item yang sudah digunakan dalam transaksi tidak dapat sembarangan dihapus atau dimodifikasi. 

---

# 12. Opening Stock

Digunakan ketika pertama kali melakukan implementasi Inventory untuk memasukkan stock yang sudah tersedia.

Data yang dicatat:

* Item.
* Source.
* PO number.
* Quantity.
* Rate.

Opening stock menggunakan prefix **OS** pada PO number. 

---

# 13. Material Transfer Note (MTN)

MTN digunakan untuk memindahkan stock dari **satu warehouse ke warehouse lain dalam perusahaan yang sama**.

Alurnya:

```text
Warehouse A
     ↓
    MTN
     ↓
Warehouse B
     ↓
Acknowledgement
     ↓
QC
```

Stock yang ditransfer dapat berdasarkan:

* Passed.
* Seconds.
* Rejected.
* Width.
* Shade.



Tersedia juga **Barcode Acknowledgement** untuk mengakui penerimaan roll menggunakan barcode. 

---

# 14. Lorry Receipt Master

**Lorry Receipt (LR)** menyimpan informasi transportasi penerimaan material, seperti:

* Supplier/processor.
* Origin.
* Payment mode.
* Vehicle number.
* Weight.
* Transfer amount.

LR kemudian dapat dikaitkan dengan GRN melalui Other Delivery Information. 

---

# 15. Stock Reconciliation

Digunakan ketika **physical stock berbeda dengan stock yang tercatat di sistem**.

Terdapat dua jenis penyesuaian:

```text
Additional
    ↓
Menambah stock

Disposal
    ↓
Mengurangi / membuang stock
```

Setiap reconciliation memiliki nomor transaksi dan report untuk melihat kondisi stock sebelum dan sesudah reconciliation. 

---

# 16. Purchase Order Closing

PO dapat ditutup ketika tidak ada transaksi lagi yang diperlukan.

Sistem dapat menampilkan:

* Quantity ordered.
* Quantity received.
* Passed.
* Rejected.
* Returned.
* Raw material delivery.
* Finished goods delivery.

Setelah PO ditutup, transaksi Receipt atau Issue tidak dapat dilakukan lagi terhadap PO tersebut. 

---

# 17. Location / Rack Management

Stock dapat dikelola berdasarkan lokasi fisik di warehouse.

Strukturnya:

```text
Warehouse
   ↓
Floor
   ↓
Rack
   ↓
Stock
```

Stock dapat dipindahkan dari floor ke rack atau dari satu rack ke rack lainnya. Quantity akan otomatis disesuaikan setelah transfer. 

---

# 18. Sample Issue & Other Issue

Digunakan untuk mengeluarkan material **tanpa Process Order atau Work Order**, misalnya untuk:

* Sample.
* Buyer requirement.
* Complimentary.
* Sampling department.
* Kebutuhan khusus lainnya.

Issue hanya dapat dilakukan sampai batas **active stock** yang tersedia. 

---

# Struktur Knowledge Base yang disarankan

Kalau modul ini nanti dimasukkan ke website Knowledge Base kamu, strukturnya bisa dibuat seperti ini:

```text
Inventory
├── Introduction
├── Issue / Receipt
│   ├── GRN
│   ├── DN
│   ├── Vendor to Vendor DC
│   └── Transaction Number
├── Quality Control
│   ├── QC
│   ├── QC Transfer
│   ├── QC Validation
│   ├── QC & Bill Passing
│   ├── QC Width Debits
│   ├── QC Reports
│   └── QC Lab Testing
├── Reorder
│   ├── Reorder Estimation
│   ├── Reorder Width
│   └── Reorder Density
├── Fabric Roll Management
│   ├── Roll Wise Stock
│   ├── Rolls Entry
│   ├── Roll QC
│   ├── Roll Barcode
│   └── Offline Scanning
├── Item Master
├── Opening Stock
├── Material Transfer Note
├── Lorry Receipt
├── Stock Reconciliation
├── PO Closing
├── Location / Rack
├── Sample Issue
├── Other Issue / Receipt
├── Process Tracking
├── Item Substitution
├── Item Ledger
├── Checklist
├── Shipment Completion
├── Stock Reports
├── Returnable / Non Returnable
├── Exchange Records
└── Gate Entry
```

**Intinya:** Inventory adalah modul yang mengontrol **pergerakan material dari penerimaan → QC → penyimpanan → transfer → issue → proses berikutnya**, sekaligus menjaga quantity, kualitas, lokasi, barcode, dan status stock. 
