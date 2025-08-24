-- Corrigir função para fazer cast correto do tipo_usuario
CREATE OR REPLACE FUNCTION public.create_user_by_admin(
  p_user_id UUID,
  p_email TEXT,
  p_tipo_usuario TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar se o usuário logado é admin, admin de clínica ou profissional
  IF NOT (is_admin() OR is_admin_clinica() OR (get_current_profissional_id() IS NOT NULL)) THEN
    RAISE EXCEPTION 'Apenas administradores e profissionais podem criar usuários';
  END IF;
  
  -- Inserir o usuário na tabela users com cast correto do tipo
  INSERT INTO public.users (id, email, tipo_usuario, senha_hash)
  VALUES (p_user_id, p_email, p_tipo_usuario::tipo_usuario, 'managed_by_auth');
  
  RETURN p_user_id;
END;
$$;