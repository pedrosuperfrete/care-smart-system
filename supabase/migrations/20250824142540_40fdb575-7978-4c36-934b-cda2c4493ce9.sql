-- Atualizar política RLS para permitir que usuários vejam outros usuários da mesma clínica
DROP POLICY IF EXISTS "Usuários podem ver suas próprias associações" ON usuarios_clinicas;

CREATE POLICY "Usuários podem ver todos da mesma clínica" ON usuarios_clinicas
FOR SELECT USING (
  -- Admin pode ver todos
  is_admin() OR 
  -- Usuários da clínica podem ver todos os usuários da mesma clínica
  clinica_id IN (
    SELECT uc.clinica_id 
    FROM usuarios_clinicas uc 
    WHERE uc.usuario_id = auth.uid() AND uc.ativo = true
  )
);