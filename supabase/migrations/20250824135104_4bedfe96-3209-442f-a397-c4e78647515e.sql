-- Criar função security definer para associar usuários às clínicas
CREATE OR REPLACE FUNCTION public.create_usuario_clinica_by_admin(
  p_usuario_id UUID,
  p_clinica_id UUID,
  p_tipo_papel TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_record_id UUID;
BEGIN
  -- Verificar se o usuário logado é admin, admin de clínica ou profissional
  IF NOT (is_admin() OR is_admin_clinica() OR (get_current_profissional_id() IS NOT NULL)) THEN
    RAISE EXCEPTION 'Apenas administradores e profissionais podem associar usuários às clínicas';
  END IF;
  
  -- Inserir na tabela usuarios_clinicas
  INSERT INTO public.usuarios_clinicas (usuario_id, clinica_id, tipo_papel, ativo)
  VALUES (p_usuario_id, p_clinica_id, p_tipo_papel, true)
  RETURNING id INTO new_record_id;
  
  RETURN new_record_id;
END;
$$;