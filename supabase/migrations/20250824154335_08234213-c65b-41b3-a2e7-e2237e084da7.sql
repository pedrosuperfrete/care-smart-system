-- Criar função de debug para can_create_patient
CREATE OR REPLACE FUNCTION debug_can_create_patient_full()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile_record record;
  prof_id UUID;
  total_pacientes INTEGER;
  prof_assinatura_ativa BOOLEAN;
  clinica_id_usuario UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Buscar dados do usuário atual
  SELECT u.*, uc.clinica_id, uc.tipo_papel INTO user_profile_record
  FROM users u
  LEFT JOIN usuarios_clinicas uc ON u.id = uc.usuario_id AND uc.ativo = true
  WHERE u.id = current_user_id
  LIMIT 1;
  
  -- Se for recepcionista, buscar dados da clínica
  IF user_profile_record.tipo_usuario = 'recepcionista' THEN
    clinica_id_usuario := user_profile_record.clinica_id;
    
    -- Buscar profissional ativo na clínica
    SELECT p.id, p.assinatura_ativa INTO prof_id, prof_assinatura_ativa
    FROM profissionais p 
    WHERE p.clinica_id = clinica_id_usuario 
    AND p.ativo = true
    LIMIT 1;
    
    -- Contar pacientes da clínica
    SELECT COUNT(*) INTO total_pacientes
    FROM pacientes p
    WHERE p.clinica_id = clinica_id_usuario
    AND p.ativo = true;
  END IF;
  
  RETURN json_build_object(
    'current_user_id', current_user_id,
    'user_profile_found', (user_profile_record.id IS NOT NULL),
    'user_tipo', user_profile_record.tipo_usuario,
    'clinica_id', clinica_id_usuario,
    'prof_id_encontrado', prof_id,
    'prof_assinatura_ativa', prof_assinatura_ativa,
    'total_pacientes', total_pacientes,
    'pode_criar_calculo', (prof_assinatura_ativa = TRUE OR total_pacientes < 2),
    'dados_completos', user_profile_record
  );
END;
$$;