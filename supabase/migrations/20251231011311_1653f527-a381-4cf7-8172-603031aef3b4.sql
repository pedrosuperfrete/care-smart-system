-- Atualizar função para incluir limite de pacientes
CREATE OR REPLACE FUNCTION public.verificar_limite_plano(p_clinica_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profissional profissionais%ROWTYPE;
  v_total_profissionais integer;
  v_total_secretarias integer;
  v_total_pacientes integer;
  v_max_profissionais integer;
  v_max_secretarias integer;
  v_max_pacientes integer;
  v_assinatura_ativa boolean;
  v_tipo_plano text;
BEGIN
  -- Buscar profissional principal (admin) da clínica
  SELECT * INTO v_profissional
  FROM profissionais
  WHERE clinica_id = p_clinica_id AND ativo = true
  ORDER BY criado_em ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'assinatura_ativa', false,
      'tipo_plano', null,
      'total_profissionais', 0,
      'total_secretarias', 0,
      'total_pacientes', 0,
      'max_profissionais', 1,
      'max_secretarias', 0,
      'max_pacientes', 1,
      'pode_adicionar_profissional', true,
      'pode_adicionar_secretaria', false,
      'pode_adicionar_paciente', true,
      'profissionais_adicionais_permitidos', 0
    );
  END IF;

  v_assinatura_ativa := COALESCE(v_profissional.assinatura_ativa, false);
  v_tipo_plano := v_profissional.tipo_plano;

  -- Contar profissionais ativos na clínica
  SELECT COUNT(*) INTO v_total_profissionais
  FROM usuarios_clinicas uc
  WHERE uc.clinica_id = p_clinica_id 
    AND uc.ativo = true 
    AND uc.tipo_papel = 'profissional';

  -- Contar secretárias ativas na clínica
  SELECT COUNT(*) INTO v_total_secretarias
  FROM usuarios_clinicas uc
  WHERE uc.clinica_id = p_clinica_id 
    AND uc.ativo = true 
    AND uc.tipo_papel = 'recepcionista';

  -- Contar pacientes ativos na clínica
  SELECT COUNT(*) INTO v_total_pacientes
  FROM pacientes p
  WHERE p.clinica_id = p_clinica_id AND p.ativo = true;

  -- Definir limites baseado no plano
  IF NOT v_assinatura_ativa THEN
    -- Sem assinatura: 1 profissional, 0 secretárias, 1 paciente (trial)
    v_max_profissionais := 1;
    v_max_secretarias := 0;
    v_max_pacientes := 1;
  ELSIF v_tipo_plano = 'solo' THEN
    -- Solo: 1 profissional + adicionais pagos, 0 secretárias, pacientes ilimitados
    v_max_profissionais := 1 + COALESCE(v_profissional.profissionais_adicionais_permitidos, 0);
    v_max_secretarias := 0;
    v_max_pacientes := 999999;
  ELSIF v_tipo_plano = 'solo_secretaria' THEN
    -- Solo + Secretária: 1 profissional + adicionais pagos, 1 secretária, pacientes ilimitados
    v_max_profissionais := 1 + COALESCE(v_profissional.profissionais_adicionais_permitidos, 0);
    v_max_secretarias := 1;
    v_max_pacientes := 999999;
  ELSE
    -- Plano desconhecido ou legado: limites básicos
    v_max_profissionais := 1;
    v_max_secretarias := 0;
    v_max_pacientes := 1;
  END IF;

  RETURN json_build_object(
    'assinatura_ativa', v_assinatura_ativa,
    'tipo_plano', v_tipo_plano,
    'total_profissionais', v_total_profissionais,
    'total_secretarias', v_total_secretarias,
    'total_pacientes', v_total_pacientes,
    'max_profissionais', v_max_profissionais,
    'max_secretarias', v_max_secretarias,
    'max_pacientes', v_max_pacientes,
    'pode_adicionar_profissional', v_total_profissionais < v_max_profissionais,
    'pode_adicionar_secretaria', v_total_secretarias < v_max_secretarias,
    'pode_adicionar_paciente', v_total_pacientes < v_max_pacientes,
    'profissionais_adicionais_permitidos', COALESCE(v_profissional.profissionais_adicionais_permitidos, 0)
  );
END;
$$;