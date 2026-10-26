create table if not exists public.cms_materials (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    title text not null,
    module text not null default '',
    module_id text not null default '',
    kind text not null default 'detail',
    summary text not null default '',
    content text not null default '',
    pdf_url text not null default '',
    image_url text not null default '',
    published boolean not null default false,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    last_edited_at timestamptz,
    last_edited_by text not null default ''
);

alter table public.cms_materials enable row level security;

create table if not exists public.cms_navigation (
    id uuid primary key default gen_random_uuid(),
    parent_id uuid references public.cms_navigation(id) on delete cascade,
    scope text not null default 'stage',
    title text not null,
    icon text not null default 'ph-link',
    page text,
    url text,
    h1 text not null default '',
    summary text not null default '',
    content text not null default '',
    nav_key text,
    node_type text not null default 'category',
    route_type text not null default 'static',
    template_key text not null default 'documentation',
    source_path text,
    published boolean not null default false,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.cms_navigation enable row level security;
alter table public.cms_navigation alter column page drop not null;
alter table public.cms_navigation alter column url drop not null;
alter table public.cms_navigation add column if not exists scope text not null default 'stage';
alter table public.cms_navigation add column if not exists h1 text not null default '';
alter table public.cms_navigation add column if not exists summary text not null default '';
alter table public.cms_navigation add column if not exists content text not null default '';
alter table public.cms_navigation add column if not exists nav_key text;
alter table public.cms_navigation add column if not exists node_type text not null default 'category';
alter table public.cms_navigation add column if not exists route_type text not null default 'static';
alter table public.cms_navigation add column if not exists template_key text not null default 'documentation';
alter table public.cms_navigation add column if not exists source_path text;
update public.cms_navigation set nav_key = lower(scope || ':' || coalesce(page, 'category-' || regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))) where nav_key is null;
update public.cms_navigation set node_type = case when page is null then 'category' else 'page' end;
update public.cms_navigation set route_type = case when url like '/api/cms/page/%' then 'dynamic' else 'static' end;
create unique index if not exists cms_navigation_nav_key_uidx on public.cms_navigation(nav_key);
create index if not exists cms_navigation_tree_idx on public.cms_navigation(scope, parent_id, sort_order, title);

alter table public.cms_materials add column if not exists module_id text not null default '';
alter table public.cms_materials add column if not exists kind text not null default 'detail';
alter table public.cms_materials add column if not exists image_url text not null default '';
alter table public.cms_materials add column if not exists last_edited_at timestamptz;
alter table public.cms_materials add column if not exists last_edited_by text not null default '';

insert into storage.buckets (id, name, public)
values ('cms-materials', 'cms-materials', true)
on conflict (id) do update set public = true;
