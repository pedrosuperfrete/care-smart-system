-- Verificar e corrigir política RLS da tabela users para permitir que usuários da mesma clínica vejam uns aos outros
DROP POLICY IF EXISTS "Users podem ver próprio perfil ou admin vê todos" ON users;

CREATE POLICY "Users podem ver perfis da mesma clínica" ON users
FOR SELECT USING (
  -- Usuário pode ver próprio perfil
  id = auth.uid() OR
  -- Admin pode ver todos
  is_admin() OR
  -- Usuários da mesma clínica podem ver uns aos outros
  id IN (
    SELECT uc.usuario_id 
    FROM usuarios_clinicas uc
    WHERE uc.clinica_id IN (
      SELECT clinica_id FROM get_user_clinicas()
    ) AND uc.ativo = true
  )
);