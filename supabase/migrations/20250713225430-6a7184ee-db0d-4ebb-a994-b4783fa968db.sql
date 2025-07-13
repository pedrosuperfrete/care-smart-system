-- Corrigir a política de inserção da tabela users para permitir que admins criem usuários
DROP POLICY IF EXISTS "Users podem criar próprio perfil" ON public.users;

CREATE POLICY "Users podem criar próprio perfil ou admin cria outros" 
ON public.users 
FOR INSERT 
WITH CHECK (
  id = auth.uid() OR is_admin() OR is_admin_clinica()
);

-- Verificar se a política de usuarios_clinicas está correta para admin_clinica
-- Vou recriar para garantir que está funcionando
DROP POLICY IF EXISTS "Admin clínica pode gerenciar usuários da clínica" ON public.usuarios_clinicas;

CREATE POLICY "Admin clínica pode gerenciar usuários da clínica" 
ON public.usuarios_clinicas 
FOR ALL 
USING (
  is_admin() OR is_admin_clinica(clinica_id)
)
WITH CHECK (
  is_admin() OR is_admin_clinica(clinica_id)
);