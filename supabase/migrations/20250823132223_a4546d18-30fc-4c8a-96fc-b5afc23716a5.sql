-- Corrigir a função can_create_patient para resolver ambiguidade de coluna
CREATE OR REPLACE FUNCTION public.can_create_patient()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
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
$function$