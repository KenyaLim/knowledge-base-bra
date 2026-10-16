# knowledge-base-bra

Knowledge Base dokumentasi ERP garment **STAGE** dan **PROMAN**. Sudah dinamis: backend **Express + MVC**, paging server-side per modul, database **PostgreSQL via Supabase**.

## 1. Tech stack — apa yang dipakai sekarang?

- **Framework backend: Express 5.3.0** (`server.js`, `api/index.js`, `src/*`). Bukan vanilla kosong lagi.
  - Deps: `express`, `dotenv`, `cookie-parser`, `multer`
  - `package.json`: `main: server.js`, scripts `start` / `dev` = `node server.js`
- **Struktur MVC:**
```
server.js                  -> entry Express, serve static + guard halaman
api/index.js               -> export app untuk Vercel serverless
src/routes/auth.js         -> POST /login, POST /logout, GET /session
src/routes/cms.js          -> GET /content, GET/POST/DELETE /admin/content, POST /admin/upload
src/controllers/authController.js -> login manual + Supabase, session
src/controllers/cmsController.js  -> paging, CRUD, upload
src/models/cmsModel.js     -> query Supabase (range, count, upsert, delete)
src/middlewares/auth.js    -> wajib login (401)
src/middlewares/admin.js   -> wajib admin (403)
src/config/supabase.js     -> SUPABASE_URL + SERVICE_ROLE_KEY + bucket
src/utils/session.js       -> cookie kb_session, HMAC-SHA256, safeNext, parsePaging
middleware.js (216 baris)  -> thin Vercel Middleware, HANYA guard halaman.
                             Semua /api/* diteruskan ke Express, tidak ada logika API dobel.
```
- **Frontend:** `index.html`, `login.html`, `admin.html`, `materials.html`, `material.html`, 38 HTML di `erp/`, `proman/`, `stage/`, `getting-started/`
- **JS:** `js/navbar.js` (navbar + sidebar + link dinamis per modul), `js/cms.js` (list + paging + baca `?slug=`), `js/admin.js` (CRUD admin), `js/erp-editor.js` (editor inline per halaman ERP via `?slug=`)
- **CSS:** `css/style.css` + Tailwind CDN + Phosphor Icons, sudah ada style `.pager` + `.module-filter`
- **Hosting:** Vercel. `vercel.json` = security headers + `rewrites /api/* -> /api/index.js`
- **Database + Auth + Storage:** Supabase (PostgreSQL + REST + Auth + Storage bucket `cms-materials`)

Yang sudah dihapus karena dobel/mati (Supabase tidak tersentuh):
- `erp/shipment/exportcon.html`, `packinglistfabric.html`, `packinglistgarmen.html` (0-byte, aslinya ada di `erp/packing/`)
- `js/documentation.js` (tidak ada HTML yang load, tidak ada `id="documentation-content"`)
- `module.html` (dobel `materials.html`, diganti `materials.html?module=X&page=1`)

## 2. Fitur sekarang

- Login/logout/session: cookie `kb_session` HttpOnly, HMAC-SHA256, 12 jam, idle 7 menit. Belum login -> `302 /login.html?next=...`. Bukan admin -> tidak bisa buka `/admin.html`.
- Login ganda: `MANUAL_USERS` (JSON) dulu, fallback Supabase Auth (`SUPABASE_URL` + `SUPABASE_ANON_KEY`).
- CMS penuh: admin buat/edit/delete/publish materi + upload PDF/gambar max 15 MB ke Supabase Storage (nama file `uuid.ext`, tidak overwrite).
- **Paging server-side per modul (limit 9, API tetap jalan, link eksplisit disembunyikan):**
  - `materials.html?module=order&page=1` -> 9 kartu per halaman + tombol Prev / 1-2-3 / Next
  - Filter modul di `materials.html`: Semua, Order, Costing, MRP, Purchase, Inventory, Packing, Shipment
  - Tanpa `?page=`/`?module=` tetap return array lama agar frontend lama tidak rusak
- Search box di dashboard + highlight hasil (`js/navbar.js`).
- 38 halaman ERP tetap jadi View per modul, isinya diambil dari Supabase via `erp-editor.js` (`GET /api/cms/content?slug=`), admin bisa edit inline.

Contoh API paging:
```
GET /api/cms/content?module=order&page=1&limit=9
-> { data: [...9 item], meta: { total, page: 1, limit: 9, totalPages, module: "order" } }

GET /api/cms/admin/content?module=mrp&page=2&limit=9  (admin, tanpa filter published)
GET /api/cms/content?slug=stage-address               (objek tunggal / null)
```

Kontrak yang dijaga: `?slug=` tetap objek/null (bukan array), error tetap `{error[,details]}`, upload tetap `{url}`, cookie tetap `kb_session`.

## 3. Fungsi tiap bagian

- `index.html` — dashboard pilih STAGE / PROMAN + search.
- `stage/home.html` — Order, Costing, MRP, Purchase, Inventory, Packing, Shipping, Address.
- `proman/home.html` — Time Study, Fabric & Trims Inward, Fabric Issue, Cutting, Production, QC.
- `erp/*`, `proman/*/*` — View dokumentasi per modul (edit inline admin, baca untuk user).
- `materials.html` — list + filter modul + pager (template dinamis utama).
- `material.html?slug=` — baca satu materi + PDF + footer last-edited.
- `admin.html` — CRUD + publish + upload (admin saja).
- `login.html` — form `POST /api/login` (identity + password + next).
- `sql/cms.sql` — migrasi sekali di Supabase (tabel + bucket).
- `0datarangkum/*.md` — sumber awal.

Alur: `admin.html` -> `POST /api/cms/admin/content` -> Express controller -> model -> Supabase `cms_materials` -> user baca `GET /api/cms/content?module=X&page=N` -> render kartu + pager.

## 4. Apakah pakai PostgreSQL?

**Ya, via Supabase (tidak install manual).**

PostgreSQL = database relasional tabel baris-kolom. Supabase menyediakan PostgreSQL + REST + Auth + Storage. Bukti: `sql/cms.sql` buat tabel `public.cms_materials`, kode memanggil `SUPABASE_URL/rest/v1/cms_materials` + `/storage/v1/object/...`.

```sql
cms_materials(id uuid, slug text unique, title text, module text, module_id text,
kind text, summary text, content text, pdf_url text, image_url text,
published bool, sort_order int, created_at timestamptz, updated_at timestamptz,
last_edited_at timestamptz, last_edited_by text)
```

Bucket `cms-materials` = file PDF/gambar publik via URL. Free tier ~1GB storage + 500MB DB, limit kode 15 MB/file.

## 5. Jalankan lokal

```bash
npm install
# isi .env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
# AUTH_SECRET, CMS_ADMIN_EMAILS, MANUAL_USERS, CMS_STORAGE_BUCKET=cms-materials
npm run dev
# buka http://localhost:3000/login.html lalu materials.html?module=order&page=1
```

Test cepat: `GET /healthz -> 200`, `GET /api/cms/content?module=order&page=1` tanpa cookie -> `401`, buka `materials.html` tanpa login -> `302 /login.html`.

## CMS setup (Vercel)

Run `sql/cms.sql` di Supabase SQL Editor sekali. Set env di Vercel:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`
- `CMS_ADMIN_EMAILS` (comma-separated)
- `MANUAL_USERS` (opsional JSON)
- `CMS_STORAGE_BUCKET` (opsional, default `cms-materials`)

```json
[
  {"username":"viewer","password":"change-this-password","name":"Viewer","role":"user"},
  {"username":"admin","password":"change-this-password","name":"Admin","role":"admin"}
]
```

Hanya `role: admin` atau email di `CMS_ADMIN_EMAILS` yang bisa buka `admin.html`, CRUD, dan upload. `Overview` = ringkasan tanpa gambar, `Detail` = teks + gambar/PDF.
