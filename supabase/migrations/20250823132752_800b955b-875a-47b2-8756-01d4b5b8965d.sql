-- Corrigir todas as funções para ter search_path seguro
-- Função 1: can_create_patient
CREATE OR REPLACE FUNCTION public.can_create_patient()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  prof_id UUID;
  total_pacientes INTEGER;
  prof_assinatura_ativa BOOLEAN;
BEGIN
  -- Buscar profissional do usuário logado
  SELECT p.id, p.assinatura_ativa INTO prof_id, prof_assinatura_ativa
  FROM profissionais p 
  WHERE p.user_id = auth.uid() 
  AND p.ativo = true;
  
  -- Se não encontrou profissional, bloquear
  IF prof_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Se tem assinatura ativa, pode criar
  IF prof_assinatura_ativa = TRUE THEN
    RETURN TRUE;
  END IF;
  
  -- Contar pacientes do profissional através das clínicas
  SELECT COUNT(*) INTO total_pacientes
  FROM pacientes p
  WHERE p.clinica_id IN (
    SELECT clinica_id 
    FROM get_user_clinicas() 
    WHERE tipo_papel = 'profissional'
  )
  AND p.ativo = true;
  
  -- Permitir se tem menos de 2 pacientes
  RETURN (total_pacientes < 2);
END;
$function$;

-- Função 2: get_user_clinicas
CREATE OR REPLACE FUNCTION public.get_user_clinicas()
 RETURNS TABLE(clinica_id uuid, tipo_papel text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT uc.clinica_id, uc.tipo_papel
  FROM usuarios_clinicas uc
  WHERE uc.usuario_id = auth.uid() AND uc.ativo = true;
END;
$function$;

-- Função 3: get_current_profissional_id  
CREATE OR REPLACE FUNCTION public.get_current_profissional_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;