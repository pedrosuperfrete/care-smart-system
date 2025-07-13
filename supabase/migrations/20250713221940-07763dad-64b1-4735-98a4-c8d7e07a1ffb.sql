-- Ajustar política RLS para permitir criação de clínicas durante cadastro
-- Remove a política ALL muito restritiva
DROP POLICY IF EXISTS "Apenas admin pode modificar clínicas" ON public.clinicas;

-- Cria políticas mais específicas
-- Permite inserção durante cadastro (quando usuário ainda não é admin)
CREATE POLICY "Usuários podem criar clínicas durante cadastro" 
ON public.clinicas 
FOR INSERT 
WITH CHECK (true);

-- Apenas admins podem atualizar e deletar clínicas existentes
CREATE POLICY "Apenas admin pode atualizar clínicas" 
ON public.clinicas 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Apenas admin pode deletar clínicas" 
ON public.clinicas 
FOR DELETE 
USING (is_admin());