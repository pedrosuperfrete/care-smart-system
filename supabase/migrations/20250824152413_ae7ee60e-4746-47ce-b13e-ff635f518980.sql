-- Permitir que profissionais atualizem suas próprias clínicas
DROP POLICY IF EXISTS "Apenas admin pode atualizar clínicas" ON clinicas;

-- Nova política que permite admin OU profissional da clínica atualizar
CREATE POLICY "Admin ou profissional podem atualizar clínicas" 
ON clinicas 
FOR UPDATE 
USING (
  is_admin() OR 
  (id IN (
    SELECT p.clinica_id 
    FROM profissionais p 
    WHERE p.user_id = auth.uid() AND p.ativo = true
  ))
);