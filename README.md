# knowledge-base-bra

Knowledge Base untuk dokumentasi ERP garment **STAGE** dan **PROMAN**. Website statis (HTML + JS) + Vercel Middleware + Supabase sebagai database & storage.

## 1. Tech stack — apa saja yang dipakai?

- **Frontend:** HTML statis di `index.html`, `login.html`, `admin.html`, `materials.html`, `material.html`, folder `erp/`, `proman/`, `stage/`, `getting-started/`
- **CSS:** `css/style.css` + Tailwind CDN + Phosphor Icons
- **JS vanilla (tanpa framework):**
  - `js/navbar.js` — navbar + sidebar + cek session login
  - `js/cms.js` — load daftar/materi dari `/api/cms/content`
  - `js/admin.js` — form CRUD materi di `admin.html`
  - `js/erp-editor.js` — editor inline di tiap halaman ERP (`contenteditable`, autosave ke Supabase)
  - `js/documentation.js` — konten statis fallback bilingual + glosarium (SPI, BOM, MRP, GRN, PO, dll)
- **Backend:** `middleware.js` (Vercel Edge Middleware). Satu file ini jadi API:
  - `POST /api/login`, `POST /api/logout`, `GET /api/session`
  - `GET /api/cms/content` — baca materi published (user login)
  - `GET/POST/DELETE /api/cms/admin/content` — CRUD materi (admin saja)
  - `POST /api/cms/admin/upload` — upload PDF/gambar ke Supabase Storage
  - Proteksi halaman: belum login → redirect ke `/login.html`, bukan admin → tidak bisa buka `/admin.html`
  - Session: cookie `kb_session` HMAC-SHA256, umur 12 jam, idle timeout 7 menit
- **Hosting:** Vercel (`vercel.json` hanya set security headers)
- **Database + Auth + Storage:** Supabase
- **Isi `package.json` sengaja kosong** (`{"type":"module"}`) — tidak pakai npm dependency, tidak ada build step.

## 2. Fungsi tiap bagian kode

- `index.html` — dashboard: pilih aplikasi STAGE atau PROMAN, ada search box.
- `stage/home.html` — home STAGE: Order, Costing, MRP, Purchase, Inventory, Packing, Shipping, Address.
- `proman/home.html` — home PROMAN: Time Study, Fabric & Trims Inward, Fabric Issue, Cutting, Production, QC.
- `erp/0-order/order.html`, `erp/1-mrp/*.html`, `erp/2-purchase/*.html`, `erp/inventory/*.html`, `erp/packing/*.html`, `erp/shipment/*.html`, `erp/costing/*.html`, `erp/address/*.html` — halaman dokumentasi tiap modul STAGE.
- `proman/timestudy/timestud.html`, `proman/fabricissue/fab.html`, `proman/cutting/cut.html`, `proman/production/prod.html`, `proman/qc/qc.html`, dll — halaman dokumentasi tiap modul PROMAN.
- `materials.html` + `material.html` — list semua materi dan halaman baca satu materi (pakai `?slug=`).
- `admin.html` — hanya admin: buat/edit/delete/publish materi, upload PDF & gambar.
- `login.html` — form login (username/email + password).
- `0datarangkum/*.md` — rangkuman sumber awal (costing, inventory, packing, proman, purchase, stage).
- `sql/cms.sql` — migrasi database, wajib dijalankan sekali di Supabase.
- `middleware.js` — otak backend + auth (lihat daftar API di atas).

Alur data: `admin.html` → `POST /api/cms/admin/content` → `middleware.js` → Supabase REST `cms_materials` → user baca via `GET /api/cms/content` → render di `material.html` / halaman ERP.

## 3. Apakah project ini pakai PostgreSQL?

**Ya, tapi tidak install manual. PostgreSQL-nya lewat Supabase.**

- PostgreSQL = database relasional (data disimpan di tabel baris-kolom, mirip Excel tapi jauh lebih kuat).
- Supabase = layanan yang sudah menyediakan PostgreSQL + REST API + Auth + Storage. Kamu cukup isi env var, tidak perlu install Postgres di laptop/Vercel.
- Bukti pemakaian: `sql/cms.sql` membuat tabel `public.cms_materials`, dan `middleware.js` memanggil `SUPABASE_URL/rest/v1/cms_materials` + `SUPABASE_URL/storage/v1/object/...`.
- Analogi simpel: Supabase = tukang parkir + gudang, PostgreSQL = gudangnya, tabel `cms_materials` = raknya, tiap materi = satu kotak di rak (kolom: `slug`, `title`, `module`, `content`, `pdf_url`, `image_url`, `published`, `sort_order`, `last_edited_by`, dll).
- Bucket `cms-materials` = lemari khusus file PDF/gambar agar bisa diakses publik via URL.

Skema inti (`sql/cms.sql`):

```sql
cms_materials(id uuid, slug text unique, title text, module text, module_id text,
kind text, summary text, content text, pdf_url text, image_url text,
published bool, sort_order int, created_at timestamptz, updated_at timestamptz,
last_edited_at timestamptz, last_edited_by text)
```

## CMS setup

FEATURES NOW
- EDITABLE IN HTML ADMIN
- STORAGE SUPABASE
- SEARCH BAR

Run `sql/cms.sql` in Supabase SQL Editor. The migration creates the CMS fields and
the public `cms-materials` Storage bucket used for PDF and image uploads.

Set these Vercel environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`
- `CMS_ADMIN_EMAILS` (comma-separated admin email addresses)
- `MANUAL_USERS` (optional JSON for local accounts, without Supabase)

Example `MANUAL_USERS` value:

```json
[
  {"username":"viewer","password":"change-this-password","name":"Viewer","role":"user"},
  {"username":"admin","password":"change-this-password","name":"Admin","role":"admin"}
]
```

Manual accounts use `user` (view-only) by default. Only an account with
`"role":"admin"` can open the CMS admin page or create, edit, delete, and
upload materials. Store this JSON in Vercel Environment Variables and replace
the example passwords before deployment. Supabase login remains available when
`SUPABASE_URL` and `SUPABASE_ANON_KEY` are configured.

Admins can select Order, MRP, Purchase, Inventory, Production, or Shipment;
published materials are added as children in that module's sidebar. Use
`Overview` for a module summary without an image and `Detail` for richer
content with text, image, and/or PDF.

The dashboard is organized by application: choose STAGE or PROMAN from
`index.html`, then use the application's Home page to open its related
modules. STAGE includes Order, Costing, MRP, Purchase, Inventory, Packing,
Shipping, and Address; PROMAN includes Time Study, Fabric & Trims Inward,
Fabric Issue, Cutting, Production, and Quality Control.
