-- Atualizar política para permitir que secretárias (recepcionistas) gerenciem tipos de serviço
DROP POLICY IF EXISTS "Profissionais podem gerenciar seus tipos de serviço" ON public.tipos_servicos;

CREATE POLICY "Usuários da clínica podem gerenciar tipos de serviço" 
ON public.tipos_servicos 
FOR ALL 
USING (
  is_admin() 
  OR (profissional_id = get_current_profissional_id()) 
  OR (
    (clinica_id IN (SELECT get_user_clinicas.clinica_id FROM get_user_clinicas() get_user_clinicas(clinica_id, tipo_papel))) 
    AND (EXISTS (
      SELECT 1 FROM get_user_clinicas() get_user_clinicas(clinica_id, tipo_papel)
      WHERE (get_user_clinicas.tipo_papel = ANY (ARRAY['admin_clinica'::text, 'profissional'::text, 'recepcionista'::text]))
    ))
  )
)
WITH CHECK (
  is_admin() 
  OR (profissional_id = get_current_profissional_id()) 
  OR (
    (clinica_id IN (SELECT get_user_clinicas.clinica_id FROM get_user_clinicas() get_user_clinicas(clinica_id, tipo_papel))) 
    AND (EXISTS (
      SELECT 1 FROM get_user_clinicas() get_user_clinicas(clinica_id, tipo_papel)
      WHERE (get_user_clinicas.tipo_papel = ANY (ARRAY['admin_clinica'::text, 'profissional'::text, 'recepcionista'::text]))
    ))
  )
);