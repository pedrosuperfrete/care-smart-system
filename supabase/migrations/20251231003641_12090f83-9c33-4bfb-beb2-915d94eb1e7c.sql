-- Atualizar política de SELECT para tipos de serviço
-- Serviços são visíveis se:
-- 1. Admin pode ver tudo
-- 2. profissional_id = profissional atual (serviço exclusivo)
-- 3. profissional_id IS NULL E clinica_id na mesma clínica (serviço da clínica, visível para todos)
-- 4. Secretárias podem ver todos da clínica para gerenciar

DROP POLICY IF EXISTS "Tipos de serviço visíveis da mesma clínica" ON public.tipos_servicos;

CREATE POLICY "Tipos de serviço visíveis conforme escopo" 
ON public.tipos_servicos 
FOR SELECT 
USING (
  is_admin() 
  OR is_recepcionista()
  OR (profissional_id = get_current_profissional_id())
  OR (
    profissional_id IS NULL 
    AND clinica_id IN (SELECT get_user_clinicas.clinica_id FROM get_user_clinicas() get_user_clinicas(clinica_id, tipo_papel))
  )
);