
## 1. Pendahuluan

Modul Costing digunakan untuk membuat quotation untuk buyer atau vendor dan menyusun budget biaya untuk setiap style atau order. Modul ini menghubungkan proses merchandising dengan Order, BOM, Purchase, Production, dan laporan keuangan.

Tujuan utama modul Costing:

- Membuat dan mengelola quotation.
- Menghitung biaya material, proses produksi, dan biaya tambahan.
- Mengonfirmasi quotation agar dapat digunakan pada Order.
- Menyusun budget berdasarkan BOM.
- Mengelola approval budget dan amendment.
- Membandingkan biaya quotation, budget, dan biaya aktual.
- Menghasilkan laporan costing dan profitabilitas.

Alur umum modul:

Quote -> Confirm -> Order -> BOM -> Budget -> Approval -> Purchase / Production -> Actual Cost -> Reporting

---

## 2. Menu Utama Costing

Menu utama yang tersedia dalam modul Costing meliputi:

1. New
2. Next
3. Modify
4. View
5. Delete
6. ChkDel
7. Tools
8. Confirm
9. Print
10. Budget
11. Budget Approval
12. Help
13. Exit

### Fungsi singkat menu

- **New**: membuat quotation baru.
- **Next**: mencari dan mengulang quotation yang sudah ada untuk dibuat menjadi quotation baru.
- **Modify**: mengubah quotation yang belum dikonfirmasi atau belum dibuatkan budget.
- **View**: melihat quotation tanpa mengubah data.
- **Delete**: menghapus quotation yang masih memenuhi syarat untuk dihapus.
- **ChkDel**: menghapus permanen atau mengembalikan quotation yang sudah dihapus.
- **Confirm**: mengonfirmasi quotation agar dapat digunakan pada Order.
- **Print**: mencetak quotation, budget, dan laporan perbandingan biaya.
- **Budget**: membuat dan mengelola budget order.
- **Budget Approval**: menyetujui item, proses, dan budget secara keseluruhan.

---

## 3. New Quote

Menu New digunakan untuk membuat quotation baru untuk buyer atau vendor.

### Data utama quotation

- Company
- Buyer atau Vendor
- Style
- Buyer reference number
- Buyer order date
- Quote date
- Quote currency
- Quote number
- Revision number
- Component
- Garment
- Size
- Season
- Country
- Terms, seperti FOB atau CIF
- Target price
- Target currency
- Quantity
- Lead days
- SAM
- Sizewise costing
- Category
- Description

Quote serial number dan quote number dibuat otomatis oleh sistem. Status quotation baru adalah **Not Confirmed**.

### Catatan pengisian quote

- Company dan Buyer berasal dari Address Module.
- Style dapat dipilih dari daftar atau dimasukkan sebagai style baru.
- Currency berasal dari Exchange Rate pada Order Module.
- Component dapat dipilih sebagai **Single** atau **Multiple**.
- Sizewise diatur menjadi **Yes** jika costing perlu dihitung per ukuran.
- Image dapat dilampirkan ke quotation jika konfigurasi image database tersedia.

### Validasi penting

Quotation yang sudah dikonfirmasi atau sudah memiliki budget tidak boleh dimodifikasi atau dihapus. Hal ini menjaga konsistensi data antara quotation, order, dan budget.

---

## 4. Struktur Biaya Quotation

Quotation terdiri dari beberapa kelompok biaya utama:

1. Fabric Cost
2. Accessories atau Trims Cost
3. Manufacturing Process Cost
4. Other Cost
5. Quota dan Freight
6. Profit dan komponen biaya tambahan

Semua biaya akan dikonversi ke currency quotation menggunakan exchange rate yang sesuai.

---

## 5. Fabric Cost

Fabric Cost digunakan untuk mencatat biaya kain atau material utama berdasarkan position.

Data yang dapat dimasukkan meliputi:

- Fabric position
- Description
- Consumption
- Unit
- Price per unit
- Price unit
- Currency
- Exchange rate
- Fabric source
- Vendor
- Fabric process
- Allowance
- Shortage
- Bank commission
- Excise duty

Secara default sistem dapat memasukkan satu fabric position. Position tambahan dapat dimasukkan melalui menu Insert atau dengan klik kanan pada area fabric.

### Detail fabric process

Dengan membuka detail position, pengguna dapat memasukkan proses seperti:

- Material Purchase
- Fabric Dyeing
- Fabric Printing
- Fabric Embroidery
- Fabric Brushing
- Fabrication
- Proses lain yang tersedia pada master

Jika fabric source adalah **Import**, bank charges dapat dimasukkan. Jika source adalah **Domestic**, kolom bank charges tidak aktif.

### Rate Master

Rate Master dapat digunakan untuk mengambil harga dari:

- Purchase Order sebelumnya melalui PO Ref.
- Quotation sebelumnya melalui Costing Ref.
- Negotiation Rate Master.

Rate yang dipilih dapat diterapkan ke proses yang sedang dikerjakan.

### Fabric knitted dan konsumsi kilogram

Untuk fabric knitted, konsumsi dapat dihitung berdasarkan GSM, diameter, panjang, dan allowance. Tombol Convert into Grams atau Convert into Kilograms digunakan untuk mengubah data ukuran menjadi konsumsi berat.

---

## 6. Accessories dan Trims Cost

Bagian Accessories digunakan untuk memasukkan material pendukung garment, seperti:

- Button
- Label
- Sewing thread
- Poly bag
- Carton
- Hanger
- Zipper
- Lace
- Strap
- Aksesori lainnya

Data yang dicatat meliputi nama material, deskripsi, konsumsi, unit, cost, currency, exchange rate, dan cost hasil konversi.

Setiap item trims dapat memiliki proses tambahan. Contohnya adalah proses button dyeing atau proses lain yang terdaftar pada Process Master.

Rate Master untuk trims dapat digunakan dengan cara yang sama seperti Rate Master pada fabric.

---

## 7. Manufacturing Process Cost

Bagian Manufacturing Process Cost digunakan untuk mencatat biaya proses per piece atau per garment.

Contoh proses:

- Production
- Cutting
- Sewing
- Garment printing
- Embroidery
- Finishing
- Proses garment lainnya

Data yang dimasukkan meliputi nama proses, deskripsi, cost, currency, exchange rate, dan cost hasil konversi.

### Perhitungan CM dan CMP

Costing dapat menghitung Cut Make atau CMP berdasarkan SAM, efficiency, hourly rate, dan Cut Make Charges.

Rumus umum:

`CMP atau CM = (SAM / (60 x Efficiency x 0.01)) x Rate`

Contoh dari manual:

- SAM = 20
- Efficiency = 50%
- Hourly rate = 2.75 USD
- Exchange rate = 45.5
- Cut Make Charges = 75 INR

Hasil CM dan CMP akan digunakan dalam perhitungan biaya garment.

---

## 8. Other Cost dan Biaya Tambahan

Other Cost digunakan untuk mencatat biaya selain fabric, trims, dan manufacturing.

Contoh biaya:

- Rejection
- Overhead
- Interest
- Other expenses
- Vendor margin
- Freight out
- Clearing expense
- Quota
- Freight
- Agency commission
- Value loss
- Working capital

### Rumus Component Cost

`Component Cost = Total Fabric Cost + Total Manufacturing Cost + Total Accessories Cost + Total Other Cost + Quota + Freight + Value Loss + Clearing Expense + Agency Commission`

---

## 9. Profit dan Garment Cost

### Profit Auto

Profit Auto dihitung berdasarkan target price dan component cost.

`Profit Auto (%) = ((Target Price x Target Exchange Rate) - Component Cost) x 100 / (Target Price x Target Exchange Rate)`

### Profit Value

Profit Value dapat dihitung menggunakan dua pendekatan:

`Profit Value (1) = Component Cost x Profit Percentage / 100`

`Profit Value (2) = (Component Cost / ((100 - Profit Percentage) x 0.01)) x (Profit Percentage x 0.01)`

### Agency Commission

Jika target price tersedia:

`Agency Commission 1 = Target Price x Agency Commission 1 (%) / 100`

Jika target price tidak tersedia, dasar perhitungan menggunakan total biaya fabric, manufacturing, accessories, other cost, dan CMT.

### Garment Cost

`Garment Cost = Component Cost + Profit Value + Working Capital Value`

Garment cost dapat ditampilkan dalam quote currency maupun currency pembanding menggunakan exchange rate.

---

## 10. Exchange Rate dan Currency

Exchange rate digunakan untuk mengonversi biaya dari currency material ke currency quotation atau default currency.

Sistem menggunakan default currency pada Exchange Rate Master sebagai dasar konversi.

Rumus konversi umum:

`Converted Value = Value x Exchange Rate Currency Asal / Exchange Rate Currency Tujuan`

Untuk membandingkan beberapa currency, pengguna dapat melihat nilai dalam quote currency, target currency, dan default currency.

---

## 11. Confirm Quote

Menu Confirm digunakan untuk mengonfirmasi quotation.

Setelah pengguna memilih Yes:

- Status quotation berubah menjadi Confirmed.
- Quotation tersedia pada daftar quotation di Order Module.
- Quotation dapat dipilih dan dilampirkan ke Order.
- Perubahan terhadap quotation menjadi terbatas.

Quotation yang sudah terhubung dengan Order tidak dapat dihapus sebelum hubungan tersebut dilepas dan konfirmasi dibatalkan.

---

## 12. Next Quote dan Modify

### Next Quote

Next Quote digunakan untuk membuat quotation baru dengan menyalin quotation yang sudah ada. Nilai atau detail tertentu dapat dimodifikasi sebelum disimpan sebagai quotation baru.

Pengguna dapat menekan F8 untuk memfilter daftar quotation berdasarkan:

- Style
- Buyer
- Garment
- Company
- Quote number
- Periode tanggal

### Modify

Modify digunakan untuk mengubah quotation yang sudah dibuat tetapi belum dikunci oleh Confirm atau Budget.

Setelah quotation dikonfirmasi atau budget sudah dibuat, perubahan tidak diperbolehkan untuk menjaga integritas data.

---

## 13. Budget

Budget digunakan untuk membuat estimasi biaya berdasarkan Order dan BOM. Budget hanya dapat dibuat setelah quotation dikonfirmasi dan BOM tersedia.

### Menu Budget

- **To be done**: menampilkan quotation yang sudah confirmed tetapi belum dibuatkan budget.
- **Amendment**: memperbarui budget setelah BOM berubah.
- **Delete**: menghapus budget yang belum mendapat full approval.
- **View**: melihat budget tanpa mengubah data.
- **Repeat**: membuat budget baru dengan menyalin rate dari budget sebelumnya.

### Data budget

Budget mengambil data dari:

- Confirmed quote
- Order reference
- BOM
- Fabric specification
- Accessories atau trims
- Manufacturing process
- Other cost
- Quantity order
- Target price
- Currency dan exchange rate

Pada budget, beberapa data dari quote seperti style dan target price tidak dapat diubah.

### Budget Amendment

Amendment digunakan ketika BOM mengalami perubahan. Perubahan material atau proses dari BOM akan ditampilkan pada budget amendment sehingga budget tetap sesuai dengan BOM terbaru.

Setelah amendment disimpan, status approval item yang berubah akan kembali menjadi Modify dan perlu disetujui kembali.

### Budget Repeat

Budget Repeat menyalin rate dari budget lama ke budget baru berdasarkan item code yang sama. Jika item code berbeda, rate tidak akan disalin dan harus dimasukkan kembali.

---

## 14. Budget Approval

Budget Approval digunakan untuk menyetujui biaya secara item-wise, process-wise, atau budget-wise.

### Menu approval

- **To be done**: daftar budget yang belum disetujui.
- **Approved**: daftar budget yang sudah mendapat full approval.
- **View**: melihat status approval tanpa melakukan perubahan.
- **Approval Unlock**: membuka budget yang terkunci karena batas amendment atau approval.
- **Approval Password**: mengatur password dan level approval per user.

### Proses approval

1. Buka daftar budget To be done.
2. Periksa item fabric, trims, dan manufacturing process.
3. Tandai item yang sudah disetujui.
4. Masukkan password approval jika diperlukan.
5. Simpan approval.
6. Budget menjadi Approved jika seluruh item dan proses sudah disetujui.

Approval budget terhubung dengan Purchase Module melalui parameter Rate Validation with Budget.

Sistem mendukung hingga tiga level approval, sesuai konfigurasi Security Parameter.

---

## 15. Reports

Menu Print menyediakan berbagai laporan Costing, antara lain:

- Quote Report
- Budget Report
- Quote Budget Comparison
- Quote Budget Comparison 2
- Costing Actual Comparison
- Budget Actual Comparison
- Order Closing Report
- Estimated Order-wise Profitability Report
- Costing Summary Report
- Trading Account Report
- Sizewise Report

### Quote Report

Menampilkan detail quotation, material, consumption, rate, cost, profit, dan total garment cost. Format dapat berupa summary atau detail.

### Budget Report

Menampilkan budget berdasarkan order dan dapat dibuat dalam format:

- Summary
- Detail
- Detail with approved default currency

### Quote Budget Comparison

Membandingkan nilai quotation dan budget untuk order atau style yang sama. Perbandingan dapat dilakukan pada fabric, trims, manufacturing, other cost, dan profit.

### Costing Actual Comparison

Membandingkan biaya pada quotation dengan biaya aktual yang berasal dari Purchase Order, GRN, QC, dan proses terkait order.

### Budget Actual Comparison

Membandingkan budget dengan actual cost serta menampilkan variance antara keduanya.

### Order Closing Report

Menampilkan perbandingan quoted cost, budgeted cost, actual cost, dan profit atau loss untuk satu order.

### Costing Summary dan Trading Account

Digunakan untuk melihat ringkasan biaya, penjualan, profit, dan komponen akun yang berhubungan dengan order.

### Export report

Laporan dapat dicetak atau diekspor ke Excel. Beberapa report juga dapat disimpan sebagai PDF melalui fungsi print report.

---

## 16. Multiple Component Quote dan Budget

Multiple Component digunakan untuk order yang terdiri dari beberapa komponen, misalnya Shirt dan Pant.

### Ketentuan multiple component

- Component harus dipilih sebagai Multiple.
- Setiap component memiliki nama yang berbeda.
- Setiap component memiliki style, type, dan description.
- No. of Pcs dapat diatur untuk setiap component.
- Detail fabric, accessories, manufacturing, dan other cost dicatat per component.

Sistem menghitung biaya setiap component secara terpisah. Pada budget, component berikutnya dapat dibuka menggunakan tombol Next.

Approval dan laporan juga dipisahkan berdasarkan component.

Laporan yang mendukung multiple component:

- Quote Print
- Budget Print
- Quote Budget Comparison Report

---

## 17. Sizewise Costing

Sizewise Costing digunakan untuk menghitung biaya berdasarkan ukuran atau article. Fitur ini cocok untuk home furnishing atau produk yang memiliki perbedaan konsumsi dan biaya pada setiap ukuran.

### Pengaturan sizewise

Pada header quotation, kolom Size dapat diatur menjadi:

- **No**: tidak menggunakan detail costing per size.
- **Yes**: membuka detail sizewise pada fabric, trims, manufacturing, other cost, dan final cost.

### Data sizewise

Detail sizewise dapat mencakup:

- Article number
- Size code
- Size quantity ratio
- Consumption value
- Consumption unit
- Price unit cost
- Quota value
- Freight value
- Agency commission
- Target price
- Profit percentage
- Value loss
- Drawback value
- Working capital
- Total garment cost

Sistem menampilkan nilai rata-rata pada halaman utama berdasarkan data per size.

### Sizewise pada setiap bagian

- **Fabric**: detail sizewise dibuka dari Process Details.
- **Trims**: article number dapat mengikuti fabric pertama, sedangkan size code, consumption, price, dan ratio diisi sesuai kebutuhan.
- **Manufacturing**: detail sizewise dibuka langsung dari proses.
- **Other Cost**: detail sizewise dibuka dari kolom biaya.
- **Final Cost**: detail sizewise berisi target price, profit, commission, quota, freight, dan nilai biaya akhir.

### Sizewise report

Sizewise Report dapat dibuat berdasarkan:

- Quote atau Budget
- Quote serial number
- Article number
- Size code
- Periode tanggal

---

## 18. Kontrol dan Validasi Data

Beberapa kontrol penting pada modul Costing:

- Quote yang sudah confirmed tidak boleh dimodifikasi sembarangan.
- Quote yang sudah terhubung ke Order tidak dapat dihapus.
- Budget yang sudah full approval tidak dapat dihapus.
- Budget amendment harus disetujui kembali jika item berubah.
- Rate harus menggunakan currency dan exchange rate yang benar.
- Multiple component harus memiliki nama dan detail component yang berbeda.
- Sizewise costing harus digunakan konsisten pada quote, budget, dan report.
- Approval password hanya boleh diberikan kepada user yang berwenang.

---

## 19. Manfaat Modul Costing

- Membantu merchandising membuat quotation dengan cepat.
- Menghasilkan perhitungan biaya yang lebih terstruktur.
- Menghubungkan quotation dengan order dan BOM.
- Memudahkan penyusunan budget produksi.
- Mengontrol perubahan biaya melalui amendment dan approval.
- Membantu membandingkan quoted, budgeted, dan actual cost.
- Mendukung costing untuk single component, multiple component, dan sizewise.
- Menyediakan laporan untuk analisis profitabilitas dan pengambilan keputusan.
