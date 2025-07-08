-- 1. Melhorar a função get_current_profissional_id para ser mais robusta
CREATE OR REPLACE FUNCTION get_current_profissional_id()
RETURNS UUID AS $$
DECLARE
  prof_id UUID;
BEGIN
  -- Primeiro tenta buscar o profissional ativo
  SELECT p.id INTO prof_id
  FROM profissionais p 
  WHERE p.user_id = auth.uid() AND p.ativo = true;
  
  RETURN prof_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Criar função auxiliar para verificar se usuário tem perfil completo
CREATE OR REPLACE FUNCTION user_has_complete_profile()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profissionais p 
    WHERE p.user_id = auth.uid() 
    AND p.ativo = true 
    AND p.onboarding_completo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Melhorar política de pacientes para incluir casos onde profissional não existe ainda
DROP POLICY IF EXISTS "Pacientes visíveis por profissional responsável ou admin ou r" ON pacientes;
CREATE POLICY "Pacientes visíveis por profissional responsável ou admin ou recepcionista" ON pacientes
FOR SELECT USING (
  is_admin() OR 
  is_recepcionista() OR
  (get_current_profissional_id() IS NOT NULL AND EXISTS (
    SELECT 1 FROM agendamentos a 
    WHERE a.paciente_id = pacientes.id 
    AND a.profissional_id = get_current_profissional_id()
  ))
);

-- 4. Melhorar política de agendamentos
DROP POLICY IF EXISTS "Agendamentos visíveis por profissional responsável ou admin o" ON agendamentos;
CREATE POLICY "Agendamentos visíveis por profissional responsável ou admin ou recepcionista" ON agendamentos
FOR SELECT USING (
  is_admin() OR 
  is_recepcionista() OR
  (get_current_profissional_id() IS NOT NULL AND profissional_id = get_current_profissional_id())
);

-- 5. Permitir que usuários vejam sua própria tabela de users durante onboarding
DROP POLICY IF EXISTS "Users podem ver próprio perfil ou admin vê todos" ON users;
CREATE POLICY "Users podem ver próprio perfil ou admin vê todos" ON users
FOR SELECT USING (
  id = auth.uid() OR 
  is_admin() OR
  -- Permitir que recepcionistas vejam todos os users para gerenciar
  is_recepcionista()
);

-- 6. Permitir que profissionais criem seu próprio perfil durante signup
DROP POLICY IF EXISTS "Admin pode inserir profissionais" ON profissionais;
CREATE POLICY "Admin ou próprio usuário pode inserir profissionais" ON profissionais
FOR INSERT WITH CHECK (
  is_admin() OR 
  user_id = auth.uid()
);

-- 7. Criar política INSERT para users (estava faltando)
CREATE POLICY "Users podem criar próprio perfil" ON users
FOR INSERT WITH CHECK (id = auth.uid());

-- 8. Melhorar política de prontuários para lidar com casos onde profissional não existe
DROP POLICY IF EXISTS "Prontuários visíveis apenas por profissional responsável ou " ON prontuarios;
CREATE POLICY "Prontuários visíveis apenas por profissional responsável ou admin" ON prontuarios
FOR SELECT USING (
  is_admin() OR
  (get_current_profissional_id() IS NOT NULL AND profissional_id = get_current_profissional_id())
);

-- 9. Melhorar política de pagamentos
DROP POLICY IF EXISTS "Pagamentos visíveis por profissional responsável ou admin" ON pagamentos;
CREATE POLICY "Pagamentos visíveis por profissional responsável ou admin" ON pagamentos
FOR SELECT USING (
  is_admin() OR
  is_recepcionista() OR
  (get_current_profissional_id() IS NOT NULL AND EXISTS (
    SELECT 1 FROM agendamentos a 
    WHERE a.id = pagamentos.agendamento_id 
    AND a.profissional_id = get_current_profissional_id()
  ))
);