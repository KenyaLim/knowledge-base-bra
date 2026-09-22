create table if not exists public.cms_materials (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    title text not null,
    module text not null default '',
    summary text not null default '',
    content text not null default '',
    pdf_url text not null default '',
    published boolean not null default false,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.cms_materials enable row level security;
