-- Corrigir funções restantes para ter search_path seguro

-- Função 8: get_current_user_clinica
CREATE OR REPLACE FUNCTION public.get_current_user_clinica()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  user_clinica_id UUID;
BEGIN
  SELECT uc.clinica_id INTO user_clinica_id
  FROM usuarios_clinicas uc
  WHERE uc.usuario_id = auth.uid() AND uc.ativo = true
  LIMIT 1;
  
  RETURN user_clinica_id;
END;
$function$;

-- Função 9: debug_auth_status
CREATE OR REPLACE FUNCTION public.debug_auth_status()
 RETURNS TABLE(current_user_id uuid, is_admin_result boolean, is_recepcionista_result boolean, profissional_id_result uuid, user_exists boolean, user_tipo text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    is_admin() as is_admin_result,
    is_recepcionista() as is_recepcionista_result,
    get_current_profissional_id() as profissional_id_result,
    EXISTS(SELECT 1 FROM users WHERE id = auth.uid()) as user_exists,
    (SELECT tipo_usuario FROM users WHERE id = auth.uid()) as user_tipo;
END;
$function$;

-- Função 10: debug_can_create_patient
CREATE OR REPLACE FUNCTION public.debug_can_create_patient()
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
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
$function$;