-- 1. Corrigir a política de templates de prontuários para incluir filtro por clínica do profissional
DROP POLICY IF EXISTS "Profissionais podem criar templates" ON public.modelos_prontuarios;

CREATE POLICY "Profissionais podem criar templates" 
ON public.modelos_prontuarios 
FOR INSERT 
WITH CHECK (
  get_current_profissional_id() IS NOT NULL AND
  clinica_id = (
    SELECT p.clinica_id 
    FROM profissionais p 
    WHERE p.id = get_current_profissional_id()
  )
);

-- 2. Corrigir a função get_current_profissional_id para garantir que retorne o profissional correto
CREATE OR REPLACE FUNCTION public.get_current_profissional_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  prof_id UUID;
BEGIN
  -- Buscar profissional do usuário logado que esteja ativo
  SELECT p.id INTO prof_id
  FROM profissionais p 
  WHERE p.user_id = auth.uid() 
  AND p.ativo = true
  LIMIT 1;
  
  RETURN prof_id;
END;
$$;