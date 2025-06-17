
-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos_prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE modelos_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acesso ENABLE ROW LEVEL SECURITY;

-- Função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND tipo_usuario = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter o profissional do usuário logado
CREATE OR REPLACE FUNCTION get_current_profissional_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT p.id FROM profissionais p 
    WHERE p.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é recepcionista
CREATE OR REPLACE FUNCTION is_recepcionista()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND tipo_usuario = 'recepcionista'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLÍTICAS PARA USERS
CREATE POLICY "Users podem ver próprio perfil ou admin vê todos" ON users
FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY "Users podem atualizar próprio perfil ou admin atualiza todos" ON users
FOR UPDATE USING (id = auth.uid() OR is_admin());

-- POLÍTICAS PARA PROFISSIONAIS
CREATE POLICY "Profissionais podem ver próprio perfil ou admin vê todos" ON profissionais
FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admin pode inserir profissionais" ON profissionais
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Profissionais podem atualizar próprio perfil ou admin atualiza todos" ON profissionais
FOR UPDATE USING (user_id = auth.uid() OR is_admin());

-- POLÍTICAS PARA CLÍNICAS
CREATE POLICY "Todos usuários autenticados podem ver clínicas" ON clinicas
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Apenas admin pode modificar clínicas" ON clinicas
FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- POLÍTICAS PARA PACIENTES
CREATE POLICY "Pacientes visíveis por profissional responsável ou admin ou recepcionista" ON pacientes
FOR SELECT USING (
  is_admin() OR 
  is_recepcionista() OR
  EXISTS (
    SELECT 1 FROM agendamentos a 
    WHERE a.paciente_id = pacientes.id 
    AND a.profissional_id = get_current_profissional_id()
  )
);

CREATE POLICY "Admin e recepcionista podem inserir pacientes" ON pacientes
FOR INSERT WITH CHECK (is_admin() OR is_recepcionista());

CREATE POLICY "Admin e recepcionista podem atualizar pacientes" ON pacientes
FOR UPDATE USING (is_admin() OR is_recepcionista());

-- POLÍTICAS PARA AGENDAMENTOS
CREATE POLICY "Agendamentos visíveis por profissional responsável ou admin ou recepcionista" ON agendamentos
FOR SELECT USING (
  is_admin() OR 
  is_recepcionista() OR
  profissional_id = get_current_profissional_id()
);

CREATE POLICY "Admin, recepcionista e profissional podem criar agendamentos" ON agendamentos
FOR INSERT WITH CHECK (
  is_admin() OR 
  is_recepcionista() OR
  profissional_id = get_current_profissional_id()
);

CREATE POLICY "Admin, recepcionista e profissional responsável podem atualizar agendamentos" ON agendamentos
FOR UPDATE USING (
  is_admin() OR 
  is_recepcionista() OR
  profissional_id = get_current_profissional_id()
);

-- POLÍTICAS PARA PAGAMENTOS
CREATE POLICY "Pagamentos visíveis por profissional responsável ou admin" ON pagamentos
FOR SELECT USING (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM agendamentos a 
    WHERE a.id = pagamentos.agendamento_id 
    AND a.profissional_id = get_current_profissional_id()
  )
);

CREATE POLICY "Admin e profissional responsável podem gerenciar pagamentos" ON pagamentos
FOR ALL USING (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM agendamentos a 
    WHERE a.id = pagamentos.agendamento_id 
    AND a.profissional_id = get_current_profissional_id()
  )
) WITH CHECK (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM agendamentos a 
    WHERE a.id = pagamentos.agendamento_id 
    AND a.profissional_id = get_current_profissional_id()
  )
);

-- POLÍTICAS PARA PRONTUÁRIOS
CREATE POLICY "Prontuários visíveis apenas por profissional responsável ou admin" ON prontuarios
FOR SELECT USING (
  is_admin() OR
  profissional_id = get_current_profissional_id()
);

CREATE POLICY "Apenas profissional responsável ou admin podem gerenciar prontuários" ON prontuarios
FOR ALL USING (
  is_admin() OR
  profissional_id = get_current_profissional_id()
) WITH CHECK (
  is_admin() OR
  profissional_id = get_current_profissional_id()
);

-- POLÍTICAS PARA DOCUMENTOS
CREATE POLICY "Documentos visíveis por profissional responsável ou admin" ON documentos
FOR SELECT USING (
  is_admin() OR
  profissional_id = get_current_profissional_id()
);

CREATE POLICY "Profissional responsável ou admin podem gerenciar documentos" ON documentos
FOR ALL USING (
  is_admin() OR
  profissional_id = get_current_profissional_id()
) WITH CHECK (
  is_admin() OR
  profissional_id = get_current_profissional_id()
);

-- POLÍTICAS PARA MODELOS
CREATE POLICY "Modelos visíveis por todos usuários autenticados" ON modelos_prontuarios
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Modelos visíveis por todos usuários autenticados" ON modelos_documentos
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Apenas admin pode gerenciar modelos" ON modelos_prontuarios
FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Apenas admin pode gerenciar modelos" ON modelos_documentos
FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- POLÍTICAS PARA LOGS
CREATE POLICY "Logs visíveis apenas por admin" ON logs_acesso
FOR SELECT USING (is_admin());

CREATE POLICY "Todos usuários podem inserir logs" ON logs_acesso
FOR INSERT WITH CHECK (user_id = auth.uid());

-- POLÍTICAS PARA NOTAS FISCAIS
CREATE POLICY "Notas fiscais visíveis por profissional responsável ou admin" ON notas_fiscais
FOR SELECT USING (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM pagamentos p
    JOIN agendamentos a ON p.agendamento_id = a.id
    WHERE p.id = notas_fiscais.pagamento_id 
    AND a.profissional_id = get_current_profissional_id()
  )
);

CREATE POLICY "Admin e profissional responsável podem gerenciar notas fiscais" ON notas_fiscais
FOR ALL USING (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM pagamentos p
    JOIN agendamentos a ON p.agendamento_id = a.id
    WHERE p.id = notas_fiscais.pagamento_id 
    AND a.profissional_id = get_current_profissional_id()
  )
) WITH CHECK (
  is_admin() OR
  EXISTS (
    SELECT 1 FROM pagamentos p
    JOIN agendamentos a ON p.agendamento_id = a.id
    WHERE p.id = notas_fiscais.pagamento_id 
    AND a.profissional_id = get_current_profissional_id()
  )
);
