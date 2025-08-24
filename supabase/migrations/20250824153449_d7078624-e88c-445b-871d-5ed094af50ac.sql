-- Remover política restritiva atual
DROP POLICY IF EXISTS "Profissionais podem ver próprio perfil ou admin vê todos" ON profissionais;

-- Criar nova política que permite acesso baseado na clínica
CREATE POLICY "Usuários da clínica podem ver profissionais da clínica" 
ON profissionais 
FOR SELECT 
USING (
  is_admin() OR 
  user_id = auth.uid() OR 
  clinica_id IN (
    SELECT clinica_id 
    FROM get_user_clinicas()
  )
);