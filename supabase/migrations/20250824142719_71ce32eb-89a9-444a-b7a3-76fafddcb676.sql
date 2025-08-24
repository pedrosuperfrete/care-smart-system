-- Corrigir política RLS para evitar recursão infinita
DROP POLICY IF EXISTS "Usuários podem ver todos da mesma clínica" ON usuarios_clinicas;

CREATE POLICY "Usuários podem ver todos da mesma clínica" ON usuarios_clinicas
FOR SELECT USING (
  -- Admin pode ver todos
  is_admin() OR 
  -- Usuários da clínica podem ver todos os usuários da mesma clínica
  -- Usando função security definer para evitar recursão
  clinica_id IN (
    SELECT clinica_id FROM get_user_clinicas()
  )
);