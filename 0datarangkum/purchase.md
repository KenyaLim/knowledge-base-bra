# Rangkuman Modul Purchase

Modul **Purchase** digunakan untuk mengelola proses pengadaan material, jasa proses, sampai kebutuhan produksi. Modul ini terhubung dengan **Export Order, Material Estimation, Inventory, Process Order, dan Work Order**. 

## 1. Struktur utama Purchase

Purchase dibagi menjadi beberapa bagian utama:

```text
PURCHASE
├── Material Purchase
│   ├── Regular Purchase
│   ├── Combined Purchase
│   └── General Purchase
│
├── Process Order
│   ├── Regular
│   ├── Combined
│   ├── General
│   └── Reprocess
│
├── Work Order
│   ├── Regular
│   └── General
│
├── Association
├── Fixing Rates
├── Pending POs
├── Terms & Conditions
├── Follow Up Details
├── Testing Standards
├── Work Instruction
├── Purchase Approval
├── PO Closing
└── Status Reports
```

Secara sederhana:

```text
EXPORT ORDER
     ↓
MATERIAL ESTIMATION
     ↓
PURCHASE
     ├── Material Purchase
     ├── Process Order
     └── Work Order
            ↓
      Inventory / Production
```

---

# 2. Material Purchase

Material Purchase digunakan untuk membeli material seperti:

* Fabric
* Trims
* Yarn
* Garment
* Made-ups
* Chemicals
* Consumables
* Machinery spare
* dan material lainnya.

Ada **3 jenis Purchase Order**:

### Regular Purchase

Purchase yang berhubungan langsung dengan satu **Export Order** dan berdasarkan material estimation.

### Combined Purchase

Satu PO digunakan untuk memenuhi kebutuhan material dari **beberapa Export Order**.

### General Purchase

Purchase yang tidak berhubungan langsung dengan Export Order. Material nantinya dapat di-associate ke order tertentu. 

---

# 3. Regular Purchase Order

Alurnya:

```text
Export Order
    ↓
Material Estimation
    ↓
Regular Purchase
    ↓
Pilih Supplier
    ↓
Pilih Material
    ↓
Qty + Rate + Currency
    ↓
Delivery Information
    ↓
Terms & Conditions
    ↓
Payment
    ↓
Approval
    ↓
PO
```

Saat membuat PO, sistem mengambil material dari **Material Estimation** dan menampilkan:

* Estimated Quantity
* Ordered Quantity
* Balance Quantity
* Quantity yang akan dibeli
* Unit
* Rate
* Currency

Sistem juga memiliki validasi agar quantity pembelian tidak melebihi balance quantity, kecuali terdapat allowance untuk excess purchase.  

---

# 4. Rate / Harga Pembelian

Purchase mempunyai beberapa cara untuk menentukan harga.

### Average Rate

Satu harga dapat diterapkan ke beberapa item sekaligus.

### Previous PO Rate

User dapat melihat:

* Supplier
* PO Date
* PO Number
* Rate sebelumnya

Kemudian rate tersebut dapat digunakan kembali. 

### Rate Utility

Digunakan untuk mengatur rate beberapa item sekaligus.

### Negotiation Price

Harga hasil negosiasi dengan supplier berdasarkan classification atau item.

### Item Wise Rate

Harga dapat dibuat berdasarkan:

* Item
* Supplier
* Buyer

Rate yang sudah disetujui kemudian dapat otomatis digunakan ketika membuat PO. 

---

# 5. Purchase Information

Purchase Order menyimpan beberapa informasi tambahan:

* Delivery information
* PO Issue Date
* Transit Days
* Terms & Conditions
* Warehouse
* Invoice To
* Next Vendor
* Bank
* Sample Details
* Other Charges
* Requirements
* Payment Details

Payment dapat mengatur **credit days dan persentase pembayaran**, misalnya pembayaran bertahap berdasarkan umur invoice.  

---

# 6. Purchase Approval

Purchase dapat menggunakan approval.

Contohnya:

```text
PO dibuat
   ↓
Menunggu Approval
   ↓
Supervisor / Authority
   ↓
Approved
   ↓
PO dapat dicetak
```

Approval dapat diterapkan berdasarkan nilai PO. Misalnya, PO di atas nilai tertentu harus mendapat approval terlebih dahulu. 

---

# 7. Modify, Delete & Cancel PO

Purchase menyediakan:

* Add
* Modify
* View
* Delete
* Check Deleted PO
* Cancel
* Undo Cancel

Ada validasi saat melakukan perubahan. Quantity PO tidak dapat dikurangi di bawah quantity yang sudah diterima di warehouse atau yang sudah terkait dengan purchase voucher. 

---

# 8. Combined Purchase Order

Digunakan ketika satu material diperlukan oleh beberapa Export Order.

Contoh:

```text
Order A → Fabric 5.000 meter
Order B → Fabric 3.000 meter
Order C → Fabric 2.000 meter
              ↓
       Combined PO
              ↓
       Supplier
              ↓
       10.000 meter
```

Sistem tetap menyimpan berapa quantity yang digunakan untuk masing-masing order.

Combined PO juga dapat menggunakan **multiple delivery dates** berdasarkan kebutuhan masing-masing order. 

---

# 9. General Purchase Order

General PO digunakan untuk pembelian yang tidak terikat Export Order.

```text
General Purchase
       ↓
Supplier
       ↓
Material
       ↓
Quantity
       ↓
Rate
       ↓
PO
       ↓
Association
       ↓
Order / Process / Work Order
```

General Purchase juga dapat dibuat berdasarkan **GPO Requisition**. 

---

# 10. GPO Requisition

Sebelum General PO dibuat, perusahaan dapat menggunakan **General Purchase Requisition**.

Alurnya:

```text
GPO Requisition
      ↓
Ceiling Validation
      ↓
Approval
      ↓
General Purchase Order
```

Sistem dapat menetapkan:

* Minimum Ceiling Quantity
* Maximum Ceiling Quantity
* Warehouse
* Unit
* Item

Tujuannya untuk membatasi quantity yang dapat direquest berdasarkan stock dan ceiling yang sudah ditentukan. 

---

# 11. Process Order

Process Order digunakan untuk pekerjaan atau proses khusus seperti:

* Dyeing
* Bleaching
* Embroidery
* Cutting
* Fabrication
* Proses lainnya

Process Order menentukan:

```text
Finished Goods
      ↑
Process
      ↑
Raw Materials
```

Regular Process Order berhubungan dengan Export Order, sedangkan General Process Order tidak berhubungan langsung dengan Export Order. 

---

# 12. Raw Material Process Order

Dalam Process Order, sistem menentukan:

### Finished Goods

Barang yang diharapkan diterima setelah proses selesai.

### Raw Materials

Material yang harus dikirim ke processor.

Sistem dapat menghitung kebutuhan raw material secara otomatis berdasarkan **Spec Sheet**.

```text
Spec Sheet
    ↓
Raw Material Consumption
    ↓
Required Quantity
    ↓
Process Order
    ↓
Vendor
```

Quantity raw material juga dapat disesuaikan apabila parameter sistem mengizinkannya. 

---

# 13. Combined Process Order

Digunakan jika beberapa Export Order memiliki proses yang sama dan dapat dikerjakan oleh processor yang sama.

```text
Order A ─┐
Order B ─┼──> Combined Process Order
Order C ─┘
                ↓
             Vendor
```

Item dari beberapa order dapat digabung berdasarkan item code, kemudian sistem menghitung raw material yang diperlukan. 

---

# 14. Reprocess

Reprocess digunakan ketika hasil proses tidak sesuai dan perlu diproses kembali.

Contohnya:

```text
Material
   ↓
Process
   ↓
Finished Goods
   ↓
Tidak sesuai
   ↓
Reprocess
   ↓
Processor / Process lain
```

Material yang akan direprocess dapat berasal dari:

* Active Stock
* Rejected Stock
* Seconds



---

# 15. Work Order

Work Order digunakan untuk proses produksi, khususnya mengubah raw material menjadi garment.

```text
Fabric + Trims
      ↓
   Work Order
      ↓
 Production
      ↓
 Finished Garment
```

Terdapat:

* Regular Work Order
* General Work Order

Regular Work Order terhubung dengan Export Order, sedangkan General Work Order tidak terhubung langsung dengan Export Order. 

---

# 16. Work Order Consumption

Work Order dapat menghitung kebutuhan material berdasarkan **Spec Sheet**.

Contohnya:

```text
Work Order Qty
      ↓
Spec Sheet Consumption
      ↓
Fabric Requirement
      ↓
Trims Requirement
      ↓
Raw Material Issue
```

Sistem dapat mengambil material dari proses sebelumnya dan menghitung quantity berdasarkan consumption.

---

# 17. Work Order berdasarkan Buyer PO

Work Order dapat dibuat berdasarkan:

* Buyer PO
* Color
* Component

Untuk order dengan multiple component, user dapat menentukan kombinasi:

```text
Buyer PO
   +
Color
   +
Component
   ↓
Work Order Quantity
```

Ini berguna ketika satu order memiliki beberapa warna atau komponen produksi.

---

# 18. Fabric Roll Selection

Purchase memiliki fitur untuk menentukan roll fabric tertentu yang akan digunakan dalam Work Order.

Alurnya:

```text
Work Order
    ↓
Raw Materials
    ↓
Roll Selection
    ↓
Pilih Roll
    ↓
Production Issue
```

Sistem memvalidasi agar quantity roll yang dipilih tidak melebihi quantity yang terkait atau estimated raw material quantity.

---

# 19. Work Instruction

**Work Instruction (WI)** digunakan untuk tracking perjalanan fabric antar proses.

Informasi yang dapat dimuat:

* Process Sequence
* Raw Material
* Finished Goods
* Next Processor
* Lot Number
* Testing Standards
* Process Order
* Quantity
* Delivery Instruction

Alurnya:

```text
Process Order
      ↓
Lot Number
      ↓
Work Instruction
      ↓
Approval
      ↓
Fabric Issue
      ↓
Process
```

WI harus melalui approval sebelum fabric dapat di-issue ke proses. 

---

# 20. Association

Association merupakan salah satu fitur penting Purchase.

Fungsinya menghubungkan material dari satu sumber ke order atau proses lain.

Contoh:

```text
General PO
   ↓
Association
   ↓
Export Order

Opening Stock
   ↓
Association
   ↓
Work Order

Purchase PO
   ↓
Association
   ↓
Process Order
```

Association digunakan karena **General Purchase, General Process Order, dan General Work Order tidak memiliki hubungan langsung dengan Export Order**. 

Jenis association di manual cukup banyak, termasuk:

* Opening Stock → Regular Process/Work Order
* Opening Stock → General Process/Work Order
* Finished Goods dari process → order
* General/Combined/Regular PO → order
* Opening Stock → order
* Reprocess dissociation
* General Sales Order association
* Automatic Dissociation

---

# 21. Pending PO

Pending PO digunakan untuk melihat kondisi purchase yang belum selesai.

Informasi yang dapat dilihat:

* PO Quantity
* Received Quantity
* Balance Quantity
* First Arrival
* Delay in Delivery
* PO yang akan jatuh tempo

User juga dapat melihat PO yang diperkirakan datang dalam beberapa hari ke depan.

---

# 22. Follow Up

Purchase menyediakan follow up untuk memonitor supplier.

### Purchase Follow Up

Meliputi:

* Dispatch Date
* ETA
* Ship Plan
* Confirmation
* Proforma
* Remarks

### Item Wise Follow Up

Dapat mencatat:

* Quantity
* Date
* Shipment Mode
* Sample Quantity
* Sample Date
* Sample Received
* Follow Up 1
* Follow Up 2

---

# 23. Testing Standards

Purchase juga menyimpan standar testing berdasarkan proses.

Strukturnya:

```text
Testing Standard
      ↓
Sub Standard
      ↓
Buyer
      ↓
Process
      ↓
Work Instruction
```

Testing standard dapat dipilih khusus untuk masing-masing buyer.

---

# 24. PO Closing

PO dapat ditutup setelah kebutuhan purchase selesai.

```text
PO
 ↓
Material Received
 ↓
Quantity terpenuhi
 ↓
PO Closing
 ↓
Tidak dapat digunakan lagi untuk Receipt
```

PO yang sudah ditutup tidak akan muncul lagi di Inventory untuk transaksi receipt terhadap PO tersebut. 

---

# 25. Import Purchase

Import Purchase digunakan untuk pembelian dari vendor luar negeri.

Konsepnya hampir sama dengan Local Purchase, tetapi terdapat perbedaan pada **currency** karena import dapat menggunakan mata uang yang dipilih, sedangkan local menggunakan default currency. 

---

# 26. Reports

Purchase mempunyai banyak report untuk monitoring.

Beberapa yang penting:

* Purchase Order Report
* Item Rates Report
* Purchase Activity Report
* Fabric Purchase Planning
* Fabric Status
* Purchase Order Value
* Work Order Completion
* Production Plan Unit / Job Worker
* PO Placed Details
* Daily Fabric Issue
* Material Receipts
* PO Inventory Status
* Delay in Delivery
* Process Order Status
* Association Report
* Vendor Rating
* Supplier Status
* Order Booked Receipts
* BOM Rate vs PO Rate
* PO Qty vs GRN Qty

---

# 27. Hubungan Purchase dengan Modul Lain

Purchase bukan modul yang berdiri sendiri.

```text
ORDER
  ↓
MATERIAL ESTIMATION
  ↓
PURCHASE
  ├──────────────┐
  ↓              ↓
Material PO   Process PO
  ↓              ↓
Inventory      Inventory
                  ↓
              Work Order
                  ↓
              Production
                  ↓
              Finished Goods
```

Hubungan utamanya:

| Modul               | Hubungan                              |
| ------------------- | ------------------------------------- |
| Order               | Menjadi referensi kebutuhan           |
| Material Estimation | Menentukan material yang perlu dibeli |
| Purchase            | Membuat PO                            |
| Inventory           | Menerima material dari PO             |
| Process Order       | Mengirim material ke processor        |
| Work Order          | Mengirim material ke produksi         |
| Production          | Menghasilkan garment                  |
| Packing             | Menangani produk setelah produksi     |

---

# Struktur Knowledge Base yang Disarankan

Kalau modul ini nanti dimasukkan ke website Knowledge Base kamu, struktur yang paling mudah dipahami:

```text
Purchase
├── Introduction
├── Material Purchase
│   ├── Regular Purchase
│   ├── Combined Purchase
│   ├── General Purchase
│   ├── Purchase Rate
│   ├── Negotiation Rate
│   ├── Purchase Approval
│   ├── Modify / Delete / Cancel
│   ├── PO Closing
│   └── Import Purchase
│
├── GPO Requisition
│   ├── Requisition
│   ├── Ceiling Master
│   ├── Approval
│   └── Item Wise Rate
│
├── Process Order
│   ├── Regular
│   ├── Combined
│   ├── General
│   ├── Raw Material
│   └── Reprocess
│
├── Work Order
│   ├── Regular
│   ├── General
│   ├── Buyer PO Wise
│   ├── Component Wise
│   ├── Consumption
│   ├── Raw Material
│   ├── Roll Selection
│   └── Work Order Print
│
├── Association
│   ├── Opening Stock
│   ├── Purchase PO
│   ├── Process Order
│   ├── Work Order
│   ├── Sales Order
│   └── Dissociation
│
├── Work Instruction
│   ├── Lot Number
│   ├── Process Sequence
│   ├── Testing Standard
│   ├── Delivery Instruction
│   └── Approval
│
├── Follow Up
│   ├── Purchase Follow Up
│   ├── Fabric Follow Up
│   ├── Item Wise Follow Up
│   └── Buyer Wise Report
│
├── Terms & Conditions
├── Pending PO
├── Fixing Rates
├── Testing Standards
├── Vendor Rating
└── Reports
```

**Intinya:** Purchase adalah modul yang mengatur **kebutuhan material → pembelian → proses vendor → produksi → association → monitoring → reporting**. Bagian paling penting untuk dipahami adalah hubungan **Material Purchase, Process Order, Work Order, Association, dan Inventory**, karena kelimanya saling terhubung dalam alur material dan produksi.
