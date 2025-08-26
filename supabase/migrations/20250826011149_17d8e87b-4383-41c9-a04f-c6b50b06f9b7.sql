-- Atualizar função create_user_by_admin para incluir o nome
CREATE OR REPLACE FUNCTION public.create_user_by_admin(p_user_id uuid, p_email text, p_tipo_usuario text, p_nome text DEFAULT NULL)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se o usuário logado é admin, admin de clínica ou profissional
  IF NOT (is_admin() OR is_admin_clinica() OR (get_current_profissional_id() IS NOT NULL)) THEN
    RAISE EXCEPTION 'Apenas administradores e profissionais podem criar usuários';
  END IF;
  
  -- Inserir o usuário na tabela users com cast correto do tipo
  INSERT INTO public.users (id, email, tipo_usuario, senha_hash, nome)
  VALUES (p_user_id, p_email, p_tipo_usuario::tipo_usuario, 'managed_by_auth', p_nome);
  
  RETURN p_user_id;
END;
$function$