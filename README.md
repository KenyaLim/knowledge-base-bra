# knowledge-base-bra

## Supabase CMS setup

Halaman di `erp/*/index.html` sekarang adalah template kategori. Materi tidak perlu dibuat sebagai file HTML baru.

1. Buat project di Supabase.
2. Buka **SQL Editor**, lalu jalankan isi file `supabase-schema.sql`. Script ini membuat tabel `documents` dan bucket Storage `documents`.
3. Buka **Project Settings > API** dan salin `Project URL` serta `service_role` key.
4. Di Vercel, buka project ini lalu masuk ke **Settings > Environment Variables**.
5. Tambahkan variable berikut untuk environment `Production`, `Preview`, dan `Development`:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AUTH_SECRET=your-existing-auth-secret
ADMIN_EMAILS=your-email@example.com
```

`ADMIN_EMAILS` berisi email yang boleh membuka dan mengubah CMS. Jika ada lebih dari satu admin, pisahkan dengan koma.

6. Deploy ulang project Vercel.
7. Login menggunakan email yang ada di `ADMIN_EMAILS`.
8. Buka `/admin.html`, klik **New document**, lalu pilih kategori dan tipe materi.
9. Untuk artikel, tulis Markdown. Untuk PDF, gambar, atau video, pilih file dari komputer.
10. Centang **Publish document**, lalu klik **Save**.
11. Materi otomatis muncul di halaman kategori, misalnya `/erp/purchase/index.html` atau `/erp/mrp/index.html`.
12. Artikel dibuka menggunakan template `/erp/document.html`; file dibuka dari Supabase Storage.

Isi materi ditulis menggunakan Markdown. `SUPABASE_SERVICE_ROLE_KEY` hanya boleh disimpan sebagai environment variable Vercel dan tidak boleh ditulis ke file browser.
