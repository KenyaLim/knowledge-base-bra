# knowledge-base-bra

## Supabase CMS setup

1. Buat project di Supabase.
2. Buka **SQL Editor**, lalu jalankan isi file `supabase-schema.sql`.
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
8. Buka `/admin.html`, buat dokumen, lalu centang **Publish document**.
9. Untuk melihat materi pertama, buka `/erp/document.html?slug=mrp-material`.

Isi materi ditulis menggunakan Markdown. `SUPABASE_SERVICE_ROLE_KEY` hanya boleh disimpan sebagai environment variable Vercel dan tidak boleh ditulis ke file browser.
