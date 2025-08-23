-- Corrigir funções restantes para ter search_path seguro

-- Função 4: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Verifica se é admin master (sistema) ou admin de clínica
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND tipo_usuario = 'admin'
  ) OR is_admin_clinica();
END;
$function$;

-- Função 5: is_admin_clinica
CREATE OR REPLACE FUNCTION public.is_admin_clinica(clinica_uuid uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Se não especificar clínica, verifica se é admin de qualquer clínica
  IF clinica_uuid IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM usuarios_clinicas uc
      WHERE uc.usuario_id = auth.uid() 
      AND uc.tipo_papel = 'admin_clinica'
      AND uc.ativo = true
    );
  END IF;
  
  -- Verifica se é admin da clínica específica
  RETURN EXISTS (
    SELECT 1 FROM usuarios_clinicas uc
    WHERE uc.usuario_id = auth.uid() 
    AND uc.clinica_id = clinica_uuid
    AND uc.tipo_papel = 'admin_clinica'
    AND uc.ativo = true
  );
END;
$function$;

-- Função 6: is_recepcionista
CREATE OR REPLACE FUNCTION public.is_recepcionista()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND tipo_usuario = 'recepcionista'
  );
END;
$function$;

-- Função 7: user_has_complete_profile
CREATE OR REPLACE FUNCTION public.user_has_complete_profile()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profissionais p 
    WHERE p.user_id = auth.uid() 
    AND p.ativo = true 
    AND p.onboarding_completo = true
  );
END;
$function$;