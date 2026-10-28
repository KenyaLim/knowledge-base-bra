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

alter table public.cms_materials add column if not exists module_id text not null default '';
alter table public.cms_materials add column if not exists kind text not null default 'detail';
alter table public.cms_materials add column if not exists image_url text not null default '';
alter table public.cms_materials add column if not exists last_edited_at timestamptz;
alter table public.cms_materials add column if not exists last_edited_by text not null default '';

create index if not exists cms_navigation_parent_id_idx on public.cms_navigation(parent_id);
create index if not exists cms_navigation_scope_sort_idx on public.cms_navigation(scope, sort_order);
create unique index if not exists cms_navigation_scope_page_idx on public.cms_navigation(scope, page) where page is not null;

create or replace function public.cms_navigation_validate() returns trigger language plpgsql as $$
begin
    if new.scope not in ('stage', 'proman') then raise exception 'Invalid CMS navigation scope'; end if;
    if new.page is null and new.url is not null then raise exception 'Modules cannot have URLs'; end if;
    if new.page is not null and new.parent_id is null then raise exception 'Pages must belong to a module'; end if;
    return new;
end;
$$;

drop trigger if exists cms_navigation_validate_trigger on public.cms_navigation;
create trigger cms_navigation_validate_trigger before insert or update on public.cms_navigation for each row execute function public.cms_navigation_validate();

insert into storage.buckets (id, name, public)
values ('cms-materials', 'cms-materials', true)
on conflict (id) do update set public = true;
