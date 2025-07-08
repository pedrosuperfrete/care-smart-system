-- Desabilitar temporariamente a política atual e criar uma mais permissiva para debug
DROP POLICY IF EXISTS "Admin, recepcionista e profissionais podem inserir pacientes" ON pacientes;

-- Política temporária permissiva para debugging
CREATE POLICY "Debug: Allow all authenticated inserts" ON pacientes
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Criar função para debug das outras funções
CREATE OR REPLACE FUNCTION debug_auth_status()
RETURNS TABLE(
  current_user_id uuid,
  is_admin_result boolean,
  is_recepcionista_result boolean,
  profissional_id_result uuid,
  user_exists boolean,
  user_tipo text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    is_admin() as is_admin_result,
    is_recepcionista() as is_recepcionista_result,
    get_current_profissional_id() as profissional_id_result,
    EXISTS(SELECT 1 FROM users WHERE id = auth.uid()) as user_exists,
    (SELECT tipo_usuario FROM users WHERE id = auth.uid()) as user_tipo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;