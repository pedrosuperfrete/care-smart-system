-- 1. Atualizar constraint do campo tipo para aceitar mais tipos de erro
ALTER TABLE erros_sistema DROP CONSTRAINT IF EXISTS erros_sistema_tipo_check;

ALTER TABLE erros_sistema ADD CONSTRAINT erros_sistema_tipo_check 
CHECK (tipo = ANY (ARRAY[
  'calendar_sync'::text, 
  'pagamento'::text, 
  'sistema'::text,
  'SUPABASE_ERROR'::text,
  'JAVASCRIPT_ERROR'::text,
  'VALIDATION_ERROR'::text,
  'NAVIGATION_ERROR'::text,
  'LIMITE_PACIENTES_ATINGIDO'::text,
  'PACIENTE_CREATE_ERROR'::text,
  'AUTH_ERROR'::text
]));

-- 2. Corrigir função can_create_patient para funcionar com recepcionistas
CREATE OR REPLACE FUNCTION public.can_create_patient()
RETURNS boolean
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
BEGIN
  -- Buscar dados do usuário atual
  SELECT u.*, uc.clinica_id, uc.tipo_papel INTO user_profile_record
  FROM users u
  LEFT JOIN usuarios_clinicas uc ON u.id = uc.usuario_id AND uc.ativo = true
  WHERE u.id = auth.uid()
  LIMIT 1;
  
  -- Se não encontrou usuário, bloquear
  IF user_profile_record.id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Se for admin, pode criar sem limite
  IF user_profile_record.tipo_usuario = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Se for profissional, verificar seu próprio limite
  IF user_profile_record.tipo_usuario = 'profissional' THEN
    -- Buscar dados do profissional
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
    
    -- Contar pacientes do profissional
    SELECT COUNT(*) INTO total_pacientes
    FROM pacientes p
    WHERE p.clinica_id = user_profile_record.clinica_id
    AND p.ativo = true;
    
    -- Permitir se tem menos de 2 pacientes
    RETURN (total_pacientes < 2);
  END IF;

  -- Se for recepcionista, verificar limite baseado na clínica
  IF user_profile_record.tipo_usuario = 'recepcionista' THEN
    clinica_id_usuario := user_profile_record.clinica_id;
    
    -- Se não tem clínica, bloquear
    IF clinica_id_usuario IS NULL THEN
      RETURN FALSE;
    END IF;
    
    -- Buscar se existe profissional ativo na clínica
    SELECT p.id, p.assinatura_ativa INTO prof_id, prof_assinatura_ativa
    FROM profissionais p 
    WHERE p.clinica_id = clinica_id_usuario 
    AND p.ativo = true
    LIMIT 1;
    
    -- Se não tem profissional na clínica, bloquear
    IF prof_id IS NULL THEN
      RETURN FALSE;
    END IF;
    
    -- Se o profissional da clínica tem assinatura ativa, pode criar
    IF prof_assinatura_ativa = TRUE THEN
      RETURN TRUE;
    END IF;
    
    -- Contar pacientes da clínica
    SELECT COUNT(*) INTO total_pacientes
    FROM pacientes p
    WHERE p.clinica_id = clinica_id_usuario
    AND p.ativo = true;
    
    -- Permitir se tem menos de 2 pacientes
    RETURN (total_pacientes < 2);
  END IF;

  -- Para outros tipos de usuário, bloquear
  RETURN FALSE;
END;
$$;