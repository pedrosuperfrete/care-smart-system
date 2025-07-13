-- Atualizar política de templates para incluir clinica_id no insert
DROP POLICY IF EXISTS "Profissionais podem criar templates" ON public.modelos_prontuarios;

CREATE POLICY "Profissionais podem criar templates" 
ON public.modelos_prontuarios 
FOR INSERT 
WITH CHECK (
  get_current_profissional_id() IS NOT NULL AND
  clinica_id IN (
    SELECT get_user_clinicas.clinica_id
    FROM get_user_clinicas() get_user_clinicas(clinica_id, tipo_papel)
  )
);