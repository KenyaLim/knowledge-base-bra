begin;

create or replace function public.cms_navigation_save(p_item jsonb, p_editor text default '')
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_old public.cms_navigation;
  v_parent public.cms_navigation;
  v_row public.cms_navigation;
  v_id uuid := coalesce(nullif(p_item->>'id', '')::uuid, gen_random_uuid());
  v_parent_id uuid := nullif(p_item->>'parent_id', '')::uuid;
  v_scope text := p_item->>'scope';
  v_type text := p_item->>'type';
  v_title text := btrim(p_item->>'title');
  v_page text;
  v_url text;
  v_order integer;
  v_exists boolean;
begin
  perform pg_advisory_xact_lock(73102941);
  select * into v_old from public.cms_navigation where id = v_id for update;
  v_exists := found;
  if p_item ? 'id' and not v_exists then raise exception 'Navigation item not found'; end if;
  if v_scope is null or v_scope not in ('stage', 'proman') or v_type is null or v_type not in ('module', 'page') or coalesce(v_title, '') = '' then
    raise exception 'Valid scope, type and title are required';
  end if;
  if v_exists and ((v_old.page is null) <> (v_type = 'module')) then raise exception 'Item type cannot change'; end if;
  if v_exists and v_old.scope <> v_scope then raise exception 'Existing items cannot change area'; end if;
  if v_parent_id is not null then
    select * into v_parent from public.cms_navigation where id = v_parent_id;
    if not found or v_parent.scope <> v_scope or v_parent.page is not null then raise exception 'Invalid parent module'; end if;
    if v_parent_id = v_id or exists (
      with recursive ancestors as (
        select id, parent_id from public.cms_navigation where id = v_parent_id
        union select n.id, n.parent_id from public.cms_navigation n join ancestors a on n.id = a.parent_id
      ) select 1 from ancestors where id = v_id
    ) then raise exception 'Navigation cycle is not allowed'; end if;
  end if;
  if v_type = 'page' and v_parent_id is null then raise exception 'A page requires a parent module'; end if;
  if v_type = 'page' and v_parent.parent_id is null and lower(v_parent.title) = v_scope and not v_exists then
    raise exception 'Select a module, not an area';
  end if;
  if v_type = 'module' and v_parent_id is not null and not (v_parent.parent_id is null and lower(v_parent.title) = v_scope) then
    raise exception 'Modules must belong to an area';
  end if;
  if v_exists and v_old.parent_id is not distinct from v_parent_id then
    v_order := v_old.sort_order;
  else
    select coalesce(max(sort_order), -100) + 100 into v_order from public.cms_navigation where scope = v_scope and parent_id is not distinct from v_parent_id;
  end if;
  if v_type = 'page' then
    v_page := v_old.page;
    v_url := v_old.url;
    if not v_exists then
      v_page := coalesce(nullif(trim(both '-' from regexp_replace(lower(v_title), '[^a-z0-9]+', '-', 'g')), ''), 'page') || '-' || v_id::text;
      if exists(select 1 from public.cms_navigation where page = v_page) or exists(select 1 from public.cms_materials where slug = v_page) then raise exception 'Page slug already exists'; end if;
      v_url := '/docs/' || v_page;
    end if;
  end if;
  insert into public.cms_navigation(id, parent_id, scope, title, icon, page, url, published, sort_order)
  values(v_id, v_parent_id, v_scope, v_title, coalesce(v_old.icon, case when v_type = 'page' then 'ph-file-text' else 'ph-folder' end), v_page, v_url, coalesce(v_old.published, true), v_order)
  on conflict(id) do update set parent_id = excluded.parent_id, title = excluded.title, sort_order = excluded.sort_order, updated_at = now()
  returning * into v_row;
  if not v_exists and v_type = 'page' then
    insert into public.cms_materials(slug, title, module, module_id, kind, content, published, sort_order, last_edited_at, last_edited_by)
    values(v_page, v_title, v_parent.title, v_parent.id::text, 'detail', '', true, v_order, now(), p_editor);
  end if;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.cms_navigation_move(p_id uuid, p_direction integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_item public.cms_navigation;
  v_ids uuid[];
  v_index integer;
  v_target integer;
  v_swap uuid;
begin
  perform pg_advisory_xact_lock(73102941);
  if p_direction not in (-1, 1) then raise exception 'Invalid direction'; end if;
  select * into v_item from public.cms_navigation where id = p_id;
  if not found then raise exception 'Navigation item not found'; end if;
  select array_agg(id order by sort_order, title, id) into v_ids from public.cms_navigation
    where scope = v_item.scope and (
      (v_item.page is not null and parent_id is not distinct from v_item.parent_id)
      or (v_item.page is null and page is null and not (parent_id is null and lower(title) = scope)
        and (parent_id is null or parent_id in (select id from public.cms_navigation where parent_id is null and lower(title) = v_item.scope and scope = v_item.scope)))
    );
  v_index := array_position(v_ids, p_id);
  v_target := v_index + p_direction;
  if v_target between 1 and array_length(v_ids, 1) then
    v_swap := v_ids[v_target]; v_ids[v_target] := p_id; v_ids[v_index] := v_swap;
    update public.cms_navigation n set sort_order = (s.ordinality - 1) * 100, updated_at = now()
      from unnest(v_ids) with ordinality s(id, ordinality) where n.id = s.id;
  end if;
  return jsonb_build_object('moved', true);
end;
$$;

create or replace function public.cms_navigation_remove(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform pg_advisory_xact_lock(73102941);
  if exists(select 1 from public.cms_navigation where parent_id = p_id) then raise exception 'Cannot delete an item with children'; end if;
  delete from public.cms_navigation where id = p_id;
  return jsonb_build_object('deleted', true);
end;
$$;

revoke all on function public.cms_navigation_save(jsonb, text) from public, anon, authenticated;
revoke all on function public.cms_navigation_move(uuid, integer) from public, anon, authenticated;
revoke all on function public.cms_navigation_remove(uuid) from public, anon, authenticated;
grant execute on function public.cms_navigation_save(jsonb, text) to service_role;
grant execute on function public.cms_navigation_move(uuid, integer) to service_role;
grant execute on function public.cms_navigation_remove(uuid) to service_role;

commit;
