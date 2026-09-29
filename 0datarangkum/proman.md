PROMAN adalah software Production Management yang mengelola proses produksi garment mulai dari Time Study, Production Planning, material, cutting, produksi, QC, sampai finishing dan menghasilkan laporan MIS. 

## 1. Gambaran besar PROMAN

Alur sederhananya:

MASTER DATA
   ↓
TIME STUDY
   ↓
PRODUCTION PLANNING
   ↓
FABRIC / TRIMS INWARD & QC
   ↓
CUTTING
   ↓
PRODUCTION
   ↓
QUALITY CONTROL
   ↓
GARMENT ISSUE / PROCESS
   ↓
FINISHING
   ↓
REPORT

PROMAN juga dapat terintegrasi dengan STAGE. Data produksi dari Head Office dapat direplikasi ke unit dan sebaliknya. 

## 2. SECURITY

Modul Security mengatur siapa yang boleh menggunakan PROMAN dan apa saja yang boleh mereka akses.

Fungsi utamanya:

* Membuat User ID dan Password.
* Mengatur privilege berdasarkan user, department, dan designation.
* Mengatur akses Unit.
* Mengatur akses Line.
* Mengatur akses Warehouse.
* Mengatur privilege Cutting Issue.
* Mengatur Freeze Date.
* Mengatur akses My Reports.
* Mengubah password Supervisor.
* Melihat User List.
* Mengatur berbagai parameter sistem. 

Ada juga konfigurasi:

* Work Order Regular atau General.
* Format PROMAN.
* Country.
* Number generation.
* Date Edit.
* Time Study.
* Fabric dan Trims.
* Cutting.
* Production.
* Barcode.
* Incentive. 

Intinya, Security adalah pusat konfigurasi dan kontrol akses PROMAN.

## 3. MASTERS

Master adalah data dasar yang digunakan oleh hampir seluruh modul PROMAN. Data di sini harus disiapkan terlebih dahulu agar dapat digunakan oleh modul lain. 

Master utama:

### Machine Types

Menyimpan jenis mesin yang digunakan di unit.

Contoh:

```text
Single Needle
Overlock
Flatlock
Button Hole
```

Data ini digunakan oleh Machine dan Time Study. 

### Line Master

Menyimpan informasi line atau batch produksi.

Data yang diatur:

* Unit
* Line
* Process
* Jumlah mesin
* Working hours
* Working minutes
* Line efficiency
* Period
* Status
* Line group

Data Line digunakan oleh Machine, Time Study, Production Planning, Cutting Issue, Production, QC, dan Garment Issue. 

### Grade Master

Mengatur grade operasi atau operator.

Berisi:

* Grade
* Seconds
* Rate

Data ini digunakan dalam perhitungan Piece Rate. 

### Parameters

Berisi data seperti:

* Garment
* Sub-classification
* Section
* Machine classification
* Part
* Repair
* dan data pendukung lainnya.

Data ini menjadi dasar bagi Time Study, Machine, Cutting, dan Production Planning. 

### Operation Master

Menyimpan operasi yang dilakukan pada garment.

Contoh:

```text
Shoulder Join
Side Seam
Sleeve Attach
Hem
Label Attach
```

Setiap operasi dapat memiliki Grade dan Operation Code. 

### Employee Operation

Menghubungkan employee dengan operasi yang mereka kerjakan serta efisiensinya. 

### Garment Wise Operation

Menghubungkan:

```text
Garment
   ↓
Sub Classification
   ↓
Section
   ↓
Operation
   ↓
Machine Type
   ↓
SMV
```

Data ini sangat penting untuk Time Study dan Production. 

### Defects Master

Menyimpan jenis defect yang dapat terjadi dalam proses produksi.

Contoh data:

* Defect Name
* Nature
* Specification
* Code
* Status

Data ini digunakan dalam Hourly Defects dan Quality Control. 

### Guide / Folder

Menyimpan instruksi atau deskripsi operasi yang nantinya dapat digunakan dalam Sampling dan Time Study. 

### Period Master

Mengatur slot waktu kerja.

Contohnya:

```text
Period 1
Period 2
Period 3
...
```

Setiap period dapat berupa Regular atau Overtime. 

### Incentive Master

Mengatur nilai incentive berdasarkan:

* Durasi kerja.
* Persentase.
* Jumlah produksi.

Data ini digunakan dalam Incentive Report. 

### Power Consumption

Menyimpan tarif dan konfigurasi konsumsi listrik per unit.

### Month Wise Target

Menyimpan target produksi bulanan setiap unit. 

## 4. TIME STUDY

Time Study digunakan untuk menentukan waktu yang dibutuhkan untuk setiap operasi garment.

Sebelum membuat Time Study, beberapa Master harus sudah tersedia:

```text
Garment
↓
Sub Classification
↓
Garment Parts
↓
Operation Master
↓
Garment Wise Operation
```

Kemudian setiap operasi dimasukkan sesuai urutan pengerjaan garment. 

Contohnya:

```text
1. Shoulder Join
2. Side Seam
3. Sleeve Attach
4. Hem
5. Final Operation
```

Urutan ini penting karena akan digunakan dalam Hourly Production. 

Time Study juga dapat memiliki:

* Flow Chart.
* Approval.
* Piece Rate Approval.
* Repeat.
* Attach Time Study to WO.
* Attach Time Study to Buyer Order.
* Thread Consumption.
* Sampling Trial.
* Operator.
* Helper.
* Machine Requirement.
* Man Power Requirement. 

## 5. PRODUCTION PLANNING

Setelah Time Study tersedia, perusahaan menentukan bagaimana order akan diproduksi.

Production Planning menentukan:

```text
Work Order
↓
Line
↓
Start Date
↓
End Date
↓
Target
↓
Quantity
```

Target produksi dihitung berdasarkan:

```text
No. Mesin
× Line Efficiency
× Working Hours
× 60
------------------------------
Sampling Time × 100
```



Modul ini juga memiliki:

* Employee Transfer.
* Team Transfer.
* Learning Curve.
* Line Balancing.
* TA Plan.

Line Balancing digunakan untuk menentukan kebutuhan mesin, jam kerja, dan kapasitas produksi agar target dapat dicapai. 

## 6. INWARD AND QC

Modul ini menangani penerimaan material dan pengecekan kualitasnya.

Material utama:

```text
Fabric
Trims
```

Proses Fabric:

```text
Fabric Inward
      ↓
Fabric QC
      ↓
Confirmed / Non Confirmed
      ↓
Fabric Issue
```

Fabric Inward mencatat material yang masuk ke warehouse. 

Fabric QC mengecek:

* Quantity.
* Roll.
* Shade.
* Width.
* Defect.
* Actual quantity.

Setelah QC, roll dikategorikan:

```text
C  = Confirmed
NC = Non Confirmed
```

Hanya roll yang Confirmed yang dapat dikirim ke proses Cutting. 

## 7. CUTTING

Cutting mengubah fabric menjadi potongan garment.

PROMAN menyediakan konfigurasi seperti:

* Cutting With / Without Cutting.
* Pieces per Bundle.
* Bundle Continue.
* Last Bundle Round Off.
* Shade Wise Bundle.
* Color Bundle.
* Roll Wise Bundle.
* Size Breakup.
* Size Wise Bundle.
* Size Ratio Wise Bundle.
* Sticker Generation.
* Manual Bundle Generation.
* Excess Cutting.
* Cut Plan Approval.
* Roll Wise Bundle Breakup. 

Contoh:

```text
Fabric
  ↓
Lay
  ↓
Cutting
  ↓
Pieces
  ↓
Bundle
  ↓
Sticker
  ↓
Line
```

Bundle digunakan untuk mengelompokkan potongan garment sebelum masuk ke proses produksi.

## 8. PRODUCTION

Production mencatat hasil produksi.

PROMAN dapat dikonfigurasi menggunakan:

```text
Hourly Production
atau
Daily Production
```

Fitur penting:

* Bundle tracking.
* Shift production.
* Vendor production.
* Plan number.
* Non-standard hours.
* Automatic Piece Rate.
* Color validation.
* Garment Issue.
* Excess quantity validation.
* QC validation. 

Bundle Track misalnya mencegah bundle yang sama diproses dua kali untuk operasi yang sama. 

## 9. BARCODE

PROMAN mendukung barcode untuk beberapa proses:

```text
Line Issue
Production
QC
Garment Issue
```

Barcode dapat digunakan untuk mengidentifikasi employee, bundle, production, dan transaksi terkait. 

Jika user memiliki privilege Barcode, sistem dapat membuka window khusus untuk scanning employee barcode dan production barcode. Hasil scanning dapat memperbarui Hourly Production. 

## 10. GARMENT ISSUE

Garment Issue digunakan untuk memindahkan garment dari satu proses ke proses berikutnya.

Contoh:

```text
Production
    ↓
Finishing Dispatch
    ↓
Outsource Process
    ↓
Finishing
```

Sistem dapat meminta acknowledgement sebelum garment dapat diteruskan ke proses berikutnya. 

Untuk proses outsource, PROMAN juga dapat mensyaratkan Receipt terlebih dahulu sebelum garment dapat diproses kembali. 

## 11. QUALITY CONTROL

QC memastikan hasil proses memenuhi standar.

Contoh validasi:

```text
Cut Quantity
↓
Production
↓
QC
↓
Passed / Reject
```

PROMAN dapat melakukan validasi berdasarkan:

* Cut Quantity.
* Color.
* Size.
* Process.
* Work Order.

Parameter tertentu juga dapat membatasi proses berikutnya sampai QC selesai. 

## 12. FINISHING

Finishing menjadi tahap akhir produksi sebelum garment masuk ke warehouse atau proses pengiriman.

PROMAN dapat terhubung dengan STAGE untuk memperbarui:

```text
Production
↓
Finishing
↓
Warehouse
```

Jika Finishing menggunakan STAGE, End Batch Summary dapat otomatis memperbarui inventory dan QC. 

## 13. PARAMETER PRODUKSI YANG PENTING

Beberapa parameter sangat menentukan bagaimana PROMAN bekerja.

Contohnya:

Production
Hourly / Daily

Cutting
With Cutting / Without Cutting

Cutting Issue
Bundle Wise / Piece Wise

QC
Using PROMAN / Using STAGE


Barcode
Yes / No


Time Study Approval
Yes / No


Parameter tersebut mengubah alur dan validasi transaksi di modul terkait. 

## 14. HUBUNGAN ANTAR MODUL

Struktur sederhananya seperti ini:

```text
SECURITY
   │
   ├── User
   ├── Privilege
   └── Parameters
          │
          ↓
       MASTERS
          │
          ├── Garment
          ├── Operation
          ├── Machine
          ├── Line
          ├── Employee
          └── Defect
          │
          ↓
      TIME STUDY
          │
          ↓
 PRODUCTION PLANNING
          │
          ├──────────────┐
          ↓              ↓
   INWARD & QC        CUTTING
          │              │
          └──────┬───────┘
                 ↓
             PRODUCTION
                 │
                 ↓
                 QC
                 │
                 ↓
          GARMENT ISSUE
                 │
                 ↓
             FINISHING
                 │
                 ↓
              REPORT
```

## 15. Inti PROMAN dalam satu kalimat

PROMAN adalah sistem yang menghubungkan data master, perencanaan produksi, material, cutting, produksi, QC, perpindahan garment, finishing, barcode, dan reporting dalam satu alur produksi garment. 

Kalau tujuan Anda adalah memahami PROMAN untuk kebutuhan knowledge base perusahaan, struktur modulnya paling mudah dibuat menjadi:

```text
PROMAN
│
├── Security
├── Masters
├── Time Study
├── Production Planning
├── Inward & QC
├── Cutting
├── Production
├── Quality Control
├── Garment Issue
├── Finishing
├── Barcode
└── Reports
```

Struktur ini cocok dijadikan Navbar Parent dan Children pada website knowledge base yang sedang Anda buat.
