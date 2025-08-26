-- Corrigir políticas RLS para usuarios_clinicas para permitir que profissionais gerenciem usuários
DROP POLICY IF EXISTS "Admin clínica pode atualizar usuários da sua clínica" ON public.usuarios_clinicas;
DROP POLICY IF EXISTS "Admin pode deletar usuários da clínica" ON public.usuarios_clinicas;
DROP POLICY IF EXISTS "Admin pode gerenciar todos usuários da clínica" ON public.usuarios_clinicas;
DROP POLICY IF EXISTS "Usuários podem se auto-associar durante cadastro" ON public.usuarios_clinicas;
DROP POLICY IF EXISTS "Usuários podem ver todos da mesma clínica" ON public.usuarios_clinicas;

-- Criar novas políticas mais específicas
CREATE POLICY "Usuários podem ver outros da mesma clínica"
ON public.usuarios_clinicas
FOR SELECT
TO authenticated
USING (
  is_admin() OR 
  (clinica_id IN (
    SELECT clinica_id 
    FROM get_user_clinicas()
  ))
);

CREATE POLICY "Usuários podem se auto-associar durante cadastro"
ON public.usuarios_clinicas
FOR INSERT
TO authenticated
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Admin ou profissional pode inserir usuários na clínica"
ON public.usuarios_clinicas
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin() OR 
  is_admin_clinica(clinica_id) OR
  (EXISTS (
    SELECT 1 FROM get_user_clinicas() uc
    WHERE uc.clinica_id = usuarios_clinicas.clinica_id
    AND uc.tipo_papel IN ('admin_clinica', 'profissional')
  ))
);

CREATE POLICY "Admin ou profissional pode atualizar usuários da clínica"
ON public.usuarios_clinicas
FOR UPDATE
TO authenticated
USING (
  is_admin() OR 
  is_admin_clinica(clinica_id) OR
  (EXISTS (
    SELECT 1 FROM get_user_clinicas() uc
    WHERE uc.clinica_id = usuarios_clinicas.clinica_id
    AND uc.tipo_papel IN ('admin_clinica', 'profissional')
  ))
)
WITH CHECK (
  is_admin() OR 
  is_admin_clinica(clinica_id) OR
  (EXISTS (
    SELECT 1 FROM get_user_clinicas() uc
    WHERE uc.clinica_id = usuarios_clinicas.clinica_id
    AND uc.tipo_papel IN ('admin_clinica', 'profissional')
  ))
);

CREATE POLICY "Admin ou profissional pode deletar usuários da clínica"
ON public.usuarios_clinicas
FOR DELETE
TO authenticated
USING (
  is_admin() OR 
  is_admin_clinica(clinica_id) OR
  (EXISTS (
    SELECT 1 FROM get_user_clinicas() uc
    WHERE uc.clinica_id = usuarios_clinicas.clinica_id
    AND uc.tipo_papel IN ('admin_clinica', 'profissional')
  ))
);