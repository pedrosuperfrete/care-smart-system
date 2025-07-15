-- Ajustar políticas RLS da tabela usuarios_clinicas para permitir auto-associação durante cadastro

-- Remover a política antiga que não permite auto-associação
DROP POLICY IF EXISTS "Admin clínica pode gerenciar usuários da clínica" ON public.usuarios_clinicas;

-- Criar políticas mais específicas
CREATE POLICY "Usuários podem se auto-associar durante cadastro"
  ON public.usuarios_clinicas
  FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Admin pode gerenciar todos usuários da clínica"
  ON public.usuarios_clinicas
  FOR ALL
  USING (is_admin() OR is_admin_clinica(clinica_id))
  WITH CHECK (is_admin() OR is_admin_clinica(clinica_id));

CREATE POLICY "Admin clínica pode atualizar usuários da sua clínica"
  ON public.usuarios_clinicas
  FOR UPDATE
  USING (is_admin() OR is_admin_clinica(clinica_id))
  WITH CHECK (is_admin() OR is_admin_clinica(clinica_id));

CREATE POLICY "Admin pode deletar usuários da clínica"
  ON public.usuarios_clinicas
  FOR DELETE
  USING (is_admin() OR is_admin_clinica(clinica_id));