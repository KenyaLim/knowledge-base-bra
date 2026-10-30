begin;

alter table public.kb_profiles add column session_version integer not null default 0 check (session_version >= 0);

create function public.kb_security_lock() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(724119, 1);
  update public.kb_admin_guard set version = version + 1 where id = 1;
  return null;
end;
$$;
create trigger kb_profiles_security_lock before update or delete on public.kb_profiles for each statement execute function public.kb_security_lock();
create trigger kb_auth_security_lock before update or delete on auth.users for each statement execute function public.kb_security_lock();

create function public.kb_password_changed() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    update public.kb_profiles set session_version = session_version + 1 where id = new.id;
    if not found then raise exception 'Missing profile'; end if;
    insert into public.kb_user_audit(target,action) values(new.id,'password.changed');
  end if;
  return new;
end;
$$;
create trigger kb_password_changed after update of encrypted_password on auth.users for each row execute function public.kb_password_changed();

create or replace function public.kb_manage_user(actor_id uuid, target_id uuid, new_name text, new_role text, new_status text) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(724119, 1);
  update public.kb_admin_guard set version = version + 1 where id = 1;
  if not exists(select 1 from public.kb_profiles where id = actor_id and role = 'admin' and status = 'active') then raise exception 'Forbidden'; end if;
  if actor_id = target_id and (new_role <> 'admin' or new_status <> 'active') then raise exception 'Self protection'; end if;
  if exists(select 1 from public.kb_profiles where id = target_id and status = 'deleting') and new_status <> 'deleting' then raise exception 'Deletion requires reconciliation'; end if;
  update public.kb_profiles set name = new_name, role = new_role, status = new_status,
    session_version = session_version + case when role is distinct from new_role or status is distinct from new_status then 1 else 0 end
    where id = target_id;
  if not found then raise exception 'Not found'; end if;
  insert into public.kb_user_audit(actor,target,action) values(actor_id,target_id,'profile.update');
end;
$$;

create function public.kb_list_users(actor_id uuid, page_number integer, page_size integer, search_text text, role_filter text, status_filter text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if not exists(select 1 from public.kb_profiles where id = actor_id and role = 'admin' and status = 'active') then raise exception 'Forbidden'; end if;
  if page_number < 1 or page_number > 1000000 or page_size < 1 or page_size > 100 or length(search_text) > 120 then raise exception 'Invalid pagination'; end if;
  with filtered as (
    select id,email,name,role,status,created_at from public.kb_profiles
    where (search_text = '' or position(lower(search_text) in lower(name || ' ' || email)) > 0)
      and (role_filter = '' or role = role_filter) and (status_filter = '' or status = status_filter)
  ), paged as (
    select * from filtered order by created_at desc,id limit page_size offset ((page_number::bigint - 1) * page_size)
  ) select jsonb_build_object('users',coalesce((select jsonb_agg(paged) from paged),'[]'::jsonb),
    'total',(select count(*) from filtered),'page',page_number,'limit',page_size,
    'summary',(select jsonb_build_object('total',count(*),'active',count(*) filter(where status='active'),'admin',count(*) filter(where role='admin'),'inactive',count(*) filter(where status<>'active')) from public.kb_profiles)) into result;
  return result;
end;
$$;
revoke all on function public.kb_security_lock(), public.kb_password_changed(), public.kb_list_users(uuid,integer,integer,text,text,text) from public,anon,authenticated;
grant execute on function public.kb_list_users(uuid,integer,integer,text,text,text) to service_role;
commit;
