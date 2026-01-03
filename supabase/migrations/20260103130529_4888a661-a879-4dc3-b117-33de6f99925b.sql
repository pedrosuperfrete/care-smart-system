-- Fix certificates trigger: certificates table uses `updated_at`, but old trigger function writes `atualizado_em`

CREATE OR REPLACE FUNCTION public.update_updated_at_column_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_certificates_updated_at ON public.certificates;

CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column_updated_at();
