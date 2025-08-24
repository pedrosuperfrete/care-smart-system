-- Corrigir política RLS de UPDATE para pacientes - incluir profissionais
DROP POLICY "Usuários da clínica podem atualizar pacientes" ON pacientes;

-- Criar nova política que permite profissionais, admin_clinica e recepcionistas atualizarem
CREATE POLICY "Usuários da clínica podem atualizar pacientes"
  ON pacientes
  FOR UPDATE
  USING (
    is_admin() OR (
      clinica_id IN (SELECT clinica_id FROM get_user_clinicas()) 
      AND EXISTS (
        SELECT 1 FROM get_user_clinicas() 
        WHERE tipo_papel = ANY(ARRAY['admin_clinica', 'profissional', 'recepcionista'])
      )
    )
  );