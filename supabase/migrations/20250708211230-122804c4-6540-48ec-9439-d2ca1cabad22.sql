-- Atualizar política de INSERT para pacientes para incluir profissionais
DROP POLICY IF EXISTS "Admin e recepcionista podem inserir pacientes" ON pacientes;

CREATE POLICY "Admin, recepcionista e profissionais podem inserir pacientes" ON pacientes
FOR INSERT WITH CHECK (
  is_admin() OR 
  is_recepcionista() OR
  (get_current_profissional_id() IS NOT NULL)
);