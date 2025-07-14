-- Criar função para verificar limite de pacientes
CREATE OR REPLACE FUNCTION public.can_create_patient()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  prof_id UUID;
  total_pacientes INTEGER;
  assinatura_ativa BOOLEAN;
BEGIN
  -- Buscar profissional do usuário logado
  SELECT id, assinatura_ativa INTO prof_id, assinatura_ativa
  FROM profissionais 
  WHERE user_id = auth.uid() 
  AND ativo = true;
  
  -- Se não encontrou profissional, bloquear
  IF prof_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Se tem assinatura ativa, pode criar
  IF assinatura_ativa = TRUE THEN
    RETURN TRUE;
  END IF;
  
  -- Contar pacientes do profissional através das clínicas
  SELECT COUNT(*) INTO total_pacientes
  FROM pacientes p
  WHERE p.clinica_id IN (
    SELECT clinica_id 
    FROM get_user_clinicas() 
    WHERE tipo_papel = 'profissional'
  )
  AND p.ativo = true;
  
  -- Permitir se tem menos de 2 pacientes
  RETURN (total_pacientes < 2);
END;
$$;

-- Atualizar policy de insert na tabela pacientes para verificar limite
DROP POLICY IF EXISTS "Usuários da clínica podem criar pacientes" ON public.pacientes;

CREATE POLICY "Usuários da clínica podem criar pacientes" 
ON public.pacientes 
FOR INSERT 
WITH CHECK (
  is_admin() OR (
    (clinica_id IN (
      SELECT get_user_clinicas.clinica_id
      FROM get_user_clinicas() get_user_clinicas(clinica_id, tipo_papel)
    )) 
    AND (
      EXISTS (
        SELECT 1
        FROM get_user_clinicas() get_user_clinicas(clinica_id, tipo_papel)
        WHERE get_user_clinicas.tipo_papel = ANY (ARRAY['admin_clinica'::text, 'recepcionista'::text])
      )
      OR can_create_patient()
    )
  )
);