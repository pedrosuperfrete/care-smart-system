-- Criar função de debug para can_create_patient
CREATE OR REPLACE FUNCTION public.debug_can_create_patient()
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  prof_id UUID;
  total_pacientes INTEGER;
  prof_assinatura_ativa BOOLEAN;
  user_id_atual UUID;
  clinicas_usuario json;
BEGIN
  -- Capturar user_id atual
  user_id_atual := auth.uid();
  
  -- Buscar clínicas do usuário
  SELECT json_agg(row_to_json(uc.*)) INTO clinicas_usuario 
  FROM get_user_clinicas() uc;
  
  -- Buscar profissional do usuário logado
  SELECT p.id, p.assinatura_ativa INTO prof_id, prof_assinatura_ativa
  FROM profissionais p 
  WHERE p.user_id = auth.uid() 
  AND p.ativo = true;
  
  -- Contar pacientes do profissional através das clínicas
  SELECT COUNT(*) INTO total_pacientes
  FROM pacientes p
  WHERE p.clinica_id IN (
    SELECT clinica_id 
    FROM get_user_clinicas() 
    WHERE tipo_papel = 'profissional'
  )
  AND p.ativo = true;
  
  -- Retornar dados de debug
  RETURN json_build_object(
    'user_id', user_id_atual,
    'prof_id', prof_id, 
    'assinatura_ativa', prof_assinatura_ativa,
    'total_pacientes', total_pacientes,
    'clinicas_usuario', clinicas_usuario,
    'pode_criar', (prof_id IS NOT NULL AND (prof_assinatura_ativa = TRUE OR total_pacientes < 2))
  );
END;
$function$