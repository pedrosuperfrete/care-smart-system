-- Criar função security definer para atualizar usuários
CREATE OR REPLACE FUNCTION public.update_user_by_admin(
  p_user_id UUID,
  p_email TEXT,
  p_tipo_usuario TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Verificar se o usuário logado é admin, admin de clínica ou profissional
  IF NOT (is_admin() OR is_admin_clinica() OR (get_current_profissional_id() IS NOT NULL)) THEN
    RAISE EXCEPTION 'Apenas administradores e profissionais podem atualizar usuários';
  END IF;
  
  -- Atualizar o usuário na tabela users
  UPDATE public.users 
  SET email = p_email, tipo_usuario = p_tipo_usuario::tipo_usuario
  WHERE id = p_user_id;
END;
$$;