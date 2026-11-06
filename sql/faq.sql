CREATE TABLE IF NOT EXISTS public.cms_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL CHECK (length(btrim(question)) BETWEEN 1 AND 300),
  answer text NOT NULL CHECK (length(answer) BETWEEN 1 AND 50000),
  category text NOT NULL CHECK (category IN ('STAGE', 'PROMAN', 'Umum')),
  published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_faqs ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.cms_faqs ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS cms_faqs_public_order ON public.cms_faqs (category, featured, sort_order, created_at, id) WHERE published;
CREATE INDEX IF NOT EXISTS cms_faqs_tags ON public.cms_faqs USING gin(tags);
ALTER TABLE public.cms_faqs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cms_faqs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_faqs TO service_role;
DROP POLICY IF EXISTS cms_faqs_backend ON public.cms_faqs;
CREATE POLICY cms_faqs_backend ON public.cms_faqs TO service_role USING (true) WITH CHECK (true);
CREATE OR REPLACE FUNCTION public.cms_mutate_faq(p_action text, p_id uuid, p_data jsonb)
RETURNS jsonb LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  item public.cms_faqs;
  neighbor public.cms_faqs;
BEGIN
  LOCK TABLE public.cms_faqs IN EXCLUSIVE MODE;
  IF p_action = 'create' THEN
    INSERT INTO public.cms_faqs(question, answer, category, published, tags, featured, sort_order)
    VALUES (p_data->>'question', p_data->>'answer', p_data->>'category', (p_data->>'published')::boolean,
      ARRAY(SELECT jsonb_array_elements_text(coalesce(p_data->'tags', '[]'::jsonb))), coalesce((p_data->>'featured')::boolean, false),
      (SELECT coalesce(max(sort_order), -1) + 1 FROM public.cms_faqs)) RETURNING * INTO item;
  ELSE
    SELECT * INTO item FROM public.cms_faqs WHERE id = p_id;
    IF NOT FOUND THEN RETURN NULL; END IF;
    IF p_action = 'update' THEN
      UPDATE public.cms_faqs SET question = p_data->>'question', answer = p_data->>'answer',
        category = p_data->>'category', published = (p_data->>'published')::boolean,
        tags = CASE WHEN p_data ? 'tags' THEN ARRAY(SELECT jsonb_array_elements_text(p_data->'tags')) ELSE item.tags END,
        featured = CASE WHEN p_data ? 'featured' THEN (p_data->>'featured')::boolean ELSE item.featured END, updated_at = now()
      WHERE id = p_id RETURNING * INTO item;
    ELSIF p_action = 'delete' THEN
      DELETE FROM public.cms_faqs WHERE id = p_id;
    ELSIF p_action = 'reorder' THEN
      IF p_data->>'direction' NOT IN ('up', 'down') OR p_data->>'direction' IS NULL THEN
        RAISE EXCEPTION 'Invalid direction';
      END IF;
      WITH positions AS (SELECT id, row_number() OVER (ORDER BY sort_order, created_at, id) - 1 AS position FROM public.cms_faqs)
      UPDATE public.cms_faqs f SET sort_order = positions.position FROM positions WHERE f.id = positions.id;
      SELECT * INTO item FROM public.cms_faqs WHERE id = p_id;
      SELECT * INTO neighbor FROM public.cms_faqs WHERE sort_order = item.sort_order + CASE WHEN p_data->>'direction' = 'up' THEN -1 ELSE 1 END;
      IF FOUND THEN
        UPDATE public.cms_faqs SET sort_order = CASE WHEN id = item.id THEN neighbor.sort_order ELSE item.sort_order END,
          updated_at = now() WHERE id IN (item.id, neighbor.id);
      END IF;
      SELECT * INTO item FROM public.cms_faqs WHERE id = p_id;
    ELSE
      RAISE EXCEPTION 'Invalid action';
    END IF;
  END IF;
  RETURN to_jsonb(item);
END;
$$;
REVOKE ALL ON FUNCTION public.cms_mutate_faq(text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cms_mutate_faq(text, uuid, jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.cms_faq_tags(p_search text, p_admin boolean DEFAULT false)
RETURNS TABLE(tag text) LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT DISTINCT t.tag FROM cms_faqs f CROSS JOIN LATERAL unnest(f.tags) t(tag)
  WHERE (p_admin OR f.published) AND starts_with(lower(t.tag), lower(p_search)) ORDER BY t.tag LIMIT 20;
$$;
REVOKE ALL ON FUNCTION public.cms_faq_tags(text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cms_faq_tags(text, boolean) TO service_role;
INSERT INTO public.cms_faqs(id, question, answer, category, published, sort_order) VALUES
('f0000000-0000-4000-8000-000000000001', 'What is the ERP system?', '<p>Input your answer here.</p>', 'Umum', true, 0),
('f0000000-0000-4000-8000-000000000002', 'How do I log in?', '<p>Input your answer here.</p>', 'Umum', true, 1),
('f0000000-0000-4000-8000-000000000003', 'What is Stage used for?', '<p>Input your answer here.</p>', 'STAGE', true, 2),
('f0000000-0000-4000-8000-000000000004', 'How do I create an order?', '<p>Input your answer here.</p>', 'STAGE', true, 3)
ON CONFLICT (id) DO NOTHING;
