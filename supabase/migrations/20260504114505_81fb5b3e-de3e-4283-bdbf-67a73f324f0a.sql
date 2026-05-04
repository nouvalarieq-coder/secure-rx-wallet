-- Fix search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Lock down SECURITY DEFINER functions: only let RLS policies use has_role (definer is owner)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Tighten fake_drug_reports insert: must include valid query, prevent abuse
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.fake_drug_reports;
CREATE POLICY "Anyone can log a check" ON public.fake_drug_reports
  FOR INSERT WITH CHECK (
    char_length(query_value) BETWEEN 1 AND 200
    AND query_type IN ('qr','bpom')
    AND result IN ('asli','palsu','tidak_ditemukan')
  );