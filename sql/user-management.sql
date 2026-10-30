begin;

create table public.kb_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'inactive', 'deleting')),
  created_at timestamptz not null default now()
);
create table public.kb_admin_guard (id integer primary key check (id = 1), version bigint not null default 0);
insert into public.kb_admin_guard(id) values (1);
create table public.kb_user_audit (
  id bigint generated always as identity primary key,
  actor uuid,
  target uuid,
  action text not null,
  created_at timestamptz not null default now()
);
create table public.kb_rate_limits (
  key text primary key,
  window_start timestamptz not null,
  attempts integer not null
);
alter table public.kb_profiles enable row level security;
alter table public.kb_admin_guard enable row level security;
alter table public.kb_user_audit enable row level security;
alter table public.kb_rate_limits enable row level security;
revoke all on public.kb_profiles, public.kb_admin_guard, public.kb_user_audit, public.kb_rate_limits from anon, authenticated;
grant select, insert, update, delete on public.kb_profiles, public.kb_admin_guard, public.kb_user_audit, public.kb_rate_limits to service_role;
grant usage, select on sequence public.kb_user_audit_id_seq to service_role;

create function public.kb_profile_guard() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.kb_admin_guard set version = version + 1 where id = 1;
  if old.role = 'admin' and old.status = 'active' then
    if TG_OP = 'DELETE' or new.role <> 'admin' or new.status <> 'active' then
      if not exists(select 1 from public.kb_profiles where role = 'admin' and status = 'active' and id <> old.id) then
        raise exception 'Last active administrator';
      end if;
    end if;
  end if;
  if TG_OP = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger kb_profile_guard before update or delete on public.kb_profiles for each row execute function public.kb_profile_guard();

create function public.kb_auth_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.kb_profiles(id,email) values(new.id,coalesce(new.email,'')) on conflict(id) do nothing;
  else
    update public.kb_profiles set email = coalesce(new.email,'') where id = new.id;
  end if;
  return new;
end;
$$;
create trigger kb_auth_profile_insert after insert on auth.users for each row execute function public.kb_auth_profile();
create trigger kb_auth_profile_email after update of email on auth.users for each row execute function public.kb_auth_profile();
insert into public.kb_profiles(id,email) select id,coalesce(email,'') from auth.users on conflict(id) do nothing;

create function public.kb_manage_user(actor_id uuid, target_id uuid, new_name text, new_role text, new_status text) returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.kb_admin_guard set version = version + 1 where id = 1;
  if not exists(select 1 from public.kb_profiles where id = actor_id and role = 'admin' and status = 'active') then raise exception 'Forbidden'; end if;
  if actor_id = target_id and (new_role <> 'admin' or new_status <> 'active') then raise exception 'Self protection'; end if;
  update public.kb_profiles set name = new_name, role = new_role, status = new_status where id = target_id;
  if not found then raise exception 'Not found'; end if;
  insert into public.kb_user_audit(actor,target,action) values(actor_id,target_id,'profile.update');
end;
$$;

create function public.kb_rate_limit(bucket text, max_attempts integer, seconds integer) returns boolean language plpgsql security definer set search_path = '' as $$
declare count_now integer;
begin
  insert into public.kb_rate_limits(key,window_start,attempts) values(bucket,clock_timestamp(),1)
  on conflict(key) do update set
    attempts = case when public.kb_rate_limits.window_start < clock_timestamp() - make_interval(secs => seconds) then 1 else public.kb_rate_limits.attempts + 1 end,
    window_start = case when public.kb_rate_limits.window_start < clock_timestamp() - make_interval(secs => seconds) then clock_timestamp() else public.kb_rate_limits.window_start end
  returning attempts into count_now;
  return count_now <= max_attempts;
end;
$$;
revoke all on function public.kb_profile_guard(), public.kb_auth_profile(), public.kb_manage_user(uuid,uuid,text,text,text), public.kb_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.kb_manage_user(uuid,uuid,text,text,text), public.kb_rate_limit(text,integer,integer) to service_role;
commit;
