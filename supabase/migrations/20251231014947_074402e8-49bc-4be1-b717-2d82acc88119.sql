-- Atualizar política de UPDATE para permitir secretárias/recepcionistas da mesma clínica
DROP POLICY IF EXISTS "Profissionais podem atualizar próprio perfil ou admin atualiza" ON profissionais;

CREATE POLICY "Profissionais podem atualizar próprio perfil ou admin ou recepcionista da clínica"
ON profissionais
FOR UPDATE
USING (
  (user_id = auth.uid()) 
  OR is_admin() 
  OR (
    -- Recepcionista da mesma clínica pode atualizar profissionais
    clinica_id IN (
      SELECT uc.clinica_id 
      FROM get_user_clinicas() uc 
      WHERE uc.tipo_papel IN ('recepcionista', 'admin_clinica')
    )
  )
);