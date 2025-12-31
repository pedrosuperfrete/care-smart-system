-- Adicionar campos para controle de plano na tabela profissionais
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS tipo_plano text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS profissionais_adicionais_permitidos integer DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN public.profissionais.tipo_plano IS 'Tipo do plano: solo (1 prof), solo_secretaria (1 prof + 1 sec), null = sem plano';
COMMENT ON COLUMN public.profissionais.profissionais_adicionais_permitidos IS 'Quantidade de profissionais adicionais pagos';

-- Função para verificar limites do plano
CREATE OR REPLACE FUNCTION public.verificar_limite_plano(p_clinica_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profissional_principal record;
  v_total_profissionais integer;
  v_total_secretarias integer;
  v_max_profissionais integer;
  v_max_secretarias integer;
  v_pode_adicionar_profissional boolean;
  v_pode_adicionar_secretaria boolean;
BEGIN
  -- Buscar profissional principal da clínica (o que tem assinatura)
  SELECT id, assinatura_ativa, tipo_plano, profissionais_adicionais_permitidos
  INTO v_profissional_principal
  FROM profissionais
  WHERE clinica_id = p_clinica_id
    AND ativo = true
    AND (assinatura_ativa = true OR tipo_plano IS NOT NULL)
  ORDER BY assinatura_ativa DESC NULLS LAST, criado_em ASC
  LIMIT 1;

  -- Contar profissionais ativos na clínica
  SELECT COUNT(*) INTO v_total_profissionais
  FROM usuarios_clinicas uc
  JOIN users u ON uc.usuario_id = u.id
  WHERE uc.clinica_id = p_clinica_id
    AND uc.ativo = true
    AND uc.tipo_papel = 'profissional';

  -- Contar secretárias ativas na clínica
  SELECT COUNT(*) INTO v_total_secretarias
  FROM usuarios_clinicas uc
  JOIN users u ON uc.usuario_id = u.id
  WHERE uc.clinica_id = p_clinica_id
    AND uc.ativo = true
    AND uc.tipo_papel = 'recepcionista';

  -- Definir limites baseados no plano
  IF v_profissional_principal.assinatura_ativa = true THEN
    CASE v_profissional_principal.tipo_plano
      WHEN 'solo' THEN
        v_max_profissionais := 1 + COALESCE(v_profissional_principal.profissionais_adicionais_permitidos, 0);
        v_max_secretarias := 0;
      WHEN 'solo_secretaria' THEN
        v_max_profissionais := 1 + COALESCE(v_profissional_principal.profissionais_adicionais_permitidos, 0);
        v_max_secretarias := 1;
      ELSE
        -- Plano não definido mas assinatura ativa = plano legacy (sem limite por enquanto)
        v_max_profissionais := 999;
        v_max_secretarias := 999;
    END CASE;
  ELSE
    -- Sem assinatura = trial: 1 profissional, 0 secretárias
    v_max_profissionais := 1;
    v_max_secretarias := 0;
  END IF;

  v_pode_adicionar_profissional := v_total_profissionais < v_max_profissionais;
  v_pode_adicionar_secretaria := v_total_secretarias < v_max_secretarias;

  RETURN json_build_object(
    'assinatura_ativa', COALESCE(v_profissional_principal.assinatura_ativa, false),
    'tipo_plano', v_profissional_principal.tipo_plano,
    'total_profissionais', v_total_profissionais,
    'total_secretarias', v_total_secretarias,
    'max_profissionais', v_max_profissionais,
    'max_secretarias', v_max_secretarias,
    'pode_adicionar_profissional', v_pode_adicionar_profissional,
    'pode_adicionar_secretaria', v_pode_adicionar_secretaria,
    'profissionais_adicionais_permitidos', COALESCE(v_profissional_principal.profissionais_adicionais_permitidos, 0)
  );
END;
$$;

-- Função para verificar se pode adicionar membro à equipe
CREATE OR REPLACE FUNCTION public.pode_adicionar_membro_equipe(p_clinica_id uuid, p_tipo_papel text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limites json;
BEGIN
  v_limites := verificar_limite_plano(p_clinica_id);
  
  IF p_tipo_papel = 'profissional' THEN
    RETURN (v_limites->>'pode_adicionar_profissional')::boolean;
  ELSIF p_tipo_papel = 'recepcionista' THEN
    RETURN (v_limites->>'pode_adicionar_secretaria')::boolean;
  ELSE
    RETURN false;
  END IF;
END;
$$;