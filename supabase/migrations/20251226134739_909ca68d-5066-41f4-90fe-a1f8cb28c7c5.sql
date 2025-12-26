-- Add input validation to SECURITY DEFINER functions that accept user input

-- 1. Update create_user_by_admin with input validation
CREATE OR REPLACE FUNCTION public.create_user_by_admin(p_user_id uuid, p_email text, p_tipo_usuario text, p_nome text DEFAULT NULL::text)
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
  
  -- Validate email format
  IF p_email IS NULL OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Formato de email inválido';
  END IF;
  
  -- Validate email length
  IF length(p_email) > 255 THEN
    RAISE EXCEPTION 'Email muito longo (máximo 255 caracteres)';
  END IF;
  
  -- Validate tipo_usuario is one of allowed values
  IF p_tipo_usuario NOT IN ('admin', 'profissional', 'recepcionista') THEN
    RAISE EXCEPTION 'Tipo de usuário inválido. Valores permitidos: admin, profissional, recepcionista';
  END IF;
  
  -- Validate nome length if provided
  IF p_nome IS NOT NULL AND length(p_nome) > 255 THEN
    RAISE EXCEPTION 'Nome muito longo (máximo 255 caracteres)';
  END IF;
  
  -- Inserir o usuário na tabela users com cast correto do tipo
  INSERT INTO public.users (id, email, tipo_usuario, senha_hash, nome)
  VALUES (p_user_id, p_email, p_tipo_usuario::tipo_usuario, 'managed_by_auth', p_nome);
  
  RETURN p_user_id;
END;
$function$;

-- 2. Update update_user_by_admin with input validation
CREATE OR REPLACE FUNCTION public.update_user_by_admin(p_user_id uuid, p_email text, p_tipo_usuario text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se o usuário logado é admin, admin de clínica ou profissional
  IF NOT (is_admin() OR is_admin_clinica() OR (get_current_profissional_id() IS NOT NULL)) THEN
    RAISE EXCEPTION 'Apenas administradores e profissionais podem atualizar usuários';
  END IF;
  
  -- Validate email format
  IF p_email IS NULL OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Formato de email inválido';
  END IF;
  
  -- Validate email length
  IF length(p_email) > 255 THEN
    RAISE EXCEPTION 'Email muito longo (máximo 255 caracteres)';
  END IF;
  
  -- Validate tipo_usuario is one of allowed values
  IF p_tipo_usuario NOT IN ('admin', 'profissional', 'recepcionista') THEN
    RAISE EXCEPTION 'Tipo de usuário inválido. Valores permitidos: admin, profissional, recepcionista';
  END IF;
  
  -- Verify user exists before updating
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  
  -- Atualizar o usuário na tabela users
  UPDATE public.users 
  SET email = p_email, tipo_usuario = p_tipo_usuario::tipo_usuario
  WHERE id = p_user_id;
END;
$function$;

-- 3. Update create_usuario_clinica_by_admin with input validation
CREATE OR REPLACE FUNCTION public.create_usuario_clinica_by_admin(p_usuario_id uuid, p_clinica_id uuid, p_tipo_papel text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_record_id UUID;
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
  IF EXISTS (SELECT 1 FROM public.usuarios_clinicas WHERE usuario_id = p_usuario_id AND clinica_id = p_clinica_id) THEN
    RAISE EXCEPTION 'Usuário já está associado a esta clínica';
  END IF;
  
  -- Inserir na tabela usuarios_clinicas
  INSERT INTO public.usuarios_clinicas (usuario_id, clinica_id, tipo_papel, ativo)
  VALUES (p_usuario_id, p_clinica_id, p_tipo_papel, true)
  RETURNING id INTO new_record_id;
  
  RETURN new_record_id;
END;
$function$;