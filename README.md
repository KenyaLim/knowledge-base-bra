# knowledge-base-bra

## Content manager

Materi PDF dan gambar dikelola dari `/admin/index.html`. PDF ditampilkan memakai
`iframe` di modal preview, sedangkan gambar memakai elemen `img`. Jika Supabase
belum dikonfigurasi, halaman dashboard menampilkan dua data demo agar UI tetap
bisa diuji.

### Environment variables Vercel

Set nilai berikut di Project Settings > Environment Variables:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=knowledge-content
AUTH_SECRET=your-existing-auth-secret
```

Isi `js/content-config.js` dengan `SUPABASE_URL` dan `SUPABASE_ANON_KEY`.
Jangan pernah memasukkan service role key ke file frontend.

### Supabase SQL

Jalankan SQL berikut di Supabase SQL Editor. Buat bucket `knowledge-content`
sebagai **public** agar URL file dapat dipakai pada `iframe` dan `img`.

```sql
create table public.content_items (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	category text not null,
	type text not null check (type in ('pdf', 'image')),
	file_url text not null,
	created_at timestamptz not null default now()
);

alter table public.content_items enable row level security;
create policy "public can read content"
	on public.content_items for select using (true);
```

API upload, edit, dan delete berjalan di server Vercel dengan service role key;
route `/api/content` tetap dilindungi middleware login proyek ini.
