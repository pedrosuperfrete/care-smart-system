-- Dropar a política existente e recriar com filtro correto para recepcionistas
DROP POLICY IF EXISTS "Tipos de serviço visíveis conforme escopo" ON tipos_servicos;

CREATE POLICY "Tipos de serviço visíveis conforme escopo" 
ON tipos_servicos
FOR SELECT
USING (
  is_admin() 
  OR (profissional_id = get_current_profissional_id())
  OR (
    -- Serviços da clínica (profissional_id é null) visíveis para usuários da mesma clínica
    profissional_id IS NULL 
    AND clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
  )
  OR (
    -- Recepcionistas podem ver serviços de profissionais da mesma clínica
    is_recepcionista() 
    AND clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
  )
);