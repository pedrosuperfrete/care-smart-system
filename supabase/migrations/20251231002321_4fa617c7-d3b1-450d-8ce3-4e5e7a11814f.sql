-- Fix: profissionais.user_id é UNIQUE, então não podemos inserir 2 registros para o mesmo usuário.

CREATE OR REPLACE FUNCTION public.create_usuario_clinica_by_admin(
  p_usuario_id uuid,
  p_clinica_id uuid,
  p_tipo_papel text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_record_id uuid;
  v_user_nome text;
BEGIN
  -- Verificar se o usuário logado é admin, admin de clínica ou profissional
  IF NOT (is_admin() OR is_admin_clinica() OR (get_current_profissional_id() IS NOT NULL)) THEN
    RAISE EXCEPTION 'Apenas administradores e profissionais podem associar usuários às clínicas';
  END IF;

  -- Validate tipo_papel is one of allowed values
  IF p_tipo_papel NOT IN ('admin_clinica', 'profissional', 'recepcionista') THEN
    RAISE EXCEPTION 'Tipo de papel inválido. Valores permitidos: admin_clinica, profissional, recepcionista';
  END IF;

  -- Validate tipo_papel length as additional safety
  IF length(p_tipo_papel) > 50 THEN
    RAISE EXCEPTION 'Tipo de papel muito longo';
  END IF;

  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_usuario_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Verify clinic exists
  IF NOT EXISTS (SELECT 1 FROM public.clinicas WHERE id = p_clinica_id) THEN
    RAISE EXCEPTION 'Clínica não encontrada';
  END IF;

  -- Check if user is already associated with this clinic
  IF EXISTS (
    SELECT 1 FROM public.usuarios_clinicas
    WHERE usuario_id = p_usuario_id AND clinica_id = p_clinica_id
  ) THEN
    RAISE EXCEPTION 'Usuário já está associado a esta clínica';
  END IF;

  -- Inserir na tabela usuarios_clinicas
  INSERT INTO public.usuarios_clinicas (usuario_id, clinica_id, tipo_papel, ativo)
  VALUES (p_usuario_id, p_clinica_id, p_tipo_papel, true)
  RETURNING id INTO new_record_id;

  -- Se for profissional, garantir registro na tabela profissionais
  IF p_tipo_papel = 'profissional' THEN
    SELECT COALESCE(u.nome, '') INTO v_user_nome
    FROM public.users u
    WHERE u.id = p_usuario_id;

    IF EXISTS (
      SELECT 1
      FROM public.profissionais p
      WHERE p.user_id = p_usuario_id
    ) THEN
      -- Como user_id é UNIQUE, apenas atualizamos o registro existente
      UPDATE public.profissionais
      SET
        clinica_id = p_clinica_id,
        ativo = true,
        nome = CASE WHEN COALESCE(nome, '') = '' THEN v_user_nome ELSE nome END,
        atualizado_em = now()
      WHERE user_id = p_usuario_id;
    ELSE
      INSERT INTO public.profissionais (
        user_id,
        clinica_id,
        nome,
        especialidade,
        crm_cro,
        onboarding_completo,
        ativo
      ) VALUES (
        p_usuario_id,
        p_clinica_id,
        v_user_nome,
        '',
        '',
        false,
        true
      );
    END IF;
  END IF;

  RETURN new_record_id;
END;
$$;

-- Backfill: criar profissionais faltantes para usuários já associados como profissional
INSERT INTO public.profissionais (
  user_id,
  clinica_id,
  nome,
  especialidade,
  crm_cro,
  onboarding_completo,
  ativo
)
SELECT
  uc.usuario_id,
  uc.clinica_id,
  COALESCE(u.nome, ''),
  '',
  '',
  false,
  true
FROM public.usuarios_clinicas uc
JOIN public.users u ON u.id = uc.usuario_id
WHERE uc.ativo = true
  AND uc.tipo_papel = 'profissional'
  AND NOT EXISTS (
    SELECT 1
    FROM public.profissionais p
    WHERE p.user_id = uc.usuario_id
  );
