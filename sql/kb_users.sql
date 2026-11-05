CREATE TABLE public.kb_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE CHECK (username = lower(username) AND username ~ '^[a-z0-9][a-z0-9_.-]{2,63}$'),
  full_name text NOT NULL CHECK (length(full_name) BETWEEN 1 AND 150),
  password_hash text NOT NULL CHECK (password_hash LIKE '$argon2id$%'),
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active boolean NOT NULL DEFAULT true,
  session_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kb_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kb_users FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.kb_users TO service_role;

CREATE FUNCTION public.kb_mutate_user(p_action text, p_id uuid, p_data jsonb, p_actor uuid, p_manual_admin boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target kb_users; result kb_users;
BEGIN
  LOCK TABLE kb_users IN EXCLUSIVE MODE;
  IF p_actor IS NOT NULL AND NOT EXISTS (SELECT 1 FROM kb_users WHERE id = p_actor AND role = 'admin' AND is_active) THEN
    RAISE EXCEPTION 'Administrator required';
  END IF;
  IF p_action NOT IN ('create', 'update', 'delete') THEN RAISE EXCEPTION 'Invalid action'; END IF;
  IF p_action = 'create' THEN
    INSERT INTO kb_users(username, full_name, password_hash, role, is_active)
    VALUES (p_data->>'username', p_data->>'full_name', p_data->>'password_hash', p_data->>'role', coalesce((p_data->>'is_active')::boolean, true)) RETURNING * INTO result;
  ELSE
    SELECT * INTO target FROM kb_users WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
    IF p_actor = p_id AND (p_action = 'delete' OR p_data->>'is_active' = 'false') THEN
      RAISE EXCEPTION 'Cannot delete or deactivate yourself';
    END IF;
    IF target.role = 'admin' AND target.is_active AND
       (p_action = 'delete' OR p_data->>'role' = 'user' OR p_data->>'is_active' = 'false') AND
       NOT p_manual_admin AND NOT EXISTS (SELECT 1 FROM kb_users WHERE id <> p_id AND role = 'admin' AND is_active) THEN
      RAISE EXCEPTION 'Last administrator';
    END IF;
    IF p_action = 'delete' THEN
      DELETE FROM kb_users WHERE id = p_id;
      RETURN jsonb_build_object('id', p_id);
    END IF;
    UPDATE kb_users SET
      username = coalesce(p_data->>'username', username),
      full_name = coalesce(p_data->>'full_name', full_name),
      role = coalesce(p_data->>'role', role),
      is_active = coalesce((p_data->>'is_active')::boolean, is_active),
      password_hash = coalesce(p_data->>'password_hash', password_hash),
      session_version = session_version + 1,
      updated_at = now()
    WHERE id = p_id RETURNING * INTO result;
  END IF;
  RETURN to_jsonb(result) - 'password_hash';
END;
$$;
REVOKE ALL ON FUNCTION public.kb_mutate_user(text, uuid, jsonb, uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kb_mutate_user(text, uuid, jsonb, uuid, boolean) TO service_role;

CREATE TABLE public.kb_action_limits (key text PRIMARY KEY, window_start timestamptz NOT NULL, attempts integer NOT NULL);
ALTER TABLE public.kb_action_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.kb_action_limits FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.kb_action_limit(p_key text, p_limit integer, p_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE count integer;
BEGIN
  INSERT INTO kb_action_limits VALUES (p_key, now(), 1)
  ON CONFLICT (key) DO UPDATE SET
    attempts = CASE WHEN kb_action_limits.window_start < now() - make_interval(secs => p_seconds) THEN 1 ELSE kb_action_limits.attempts + 1 END,
    window_start = CASE WHEN kb_action_limits.window_start < now() - make_interval(secs => p_seconds) THEN now() ELSE kb_action_limits.window_start END
  RETURNING attempts INTO count;
  RETURN count <= p_limit;
END;
$$;
REVOKE ALL ON FUNCTION public.kb_action_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kb_action_limit(text, integer, integer) TO service_role;
