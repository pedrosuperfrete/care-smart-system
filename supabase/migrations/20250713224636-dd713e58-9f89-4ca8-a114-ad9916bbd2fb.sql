-- Remover a política de debug que permite ver todos os pacientes
DROP POLICY IF EXISTS "Debug: Allow all authenticated inserts" ON public.pacientes;

-- Criar política de inserção mais restritiva
CREATE POLICY "Usuários da clínica podem criar pacientes" 
ON public.pacientes 
FOR INSERT 
WITH CHECK (
  is_admin() OR (
    clinica_id IN (
      SELECT get_user_clinicas.clinica_id
      FROM get_user_clinicas() get_user_clinicas(clinica_id, tipo_papel)
    ) AND EXISTS (
      SELECT 1
      FROM get_user_clinicas() get_user_clinicas(clinica_id, tipo_papel)
      WHERE get_user_clinicas.tipo_papel = ANY (ARRAY['admin_clinica'::text, 'recepcionista'::text])
    )
  )
);