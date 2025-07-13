-- Criar tabela de associação usuários-clínicas
CREATE TABLE public.usuarios_clinicas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  tipo_papel TEXT NOT NULL CHECK (tipo_papel IN ('admin_clinica', 'profissional', 'recepcionista')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, clinica_id, tipo_papel)
);

-- Habilitar RLS
ALTER TABLE public.usuarios_clinicas ENABLE ROW LEVEL SECURITY;

-- Migrar dados existentes dos profissionais para a nova tabela
INSERT INTO public.usuarios_clinicas (usuario_id, clinica_id, tipo_papel)
SELECT 
  p.user_id,
  p.clinica_id,
  'profissional'
FROM public.profissionais p
WHERE p.user_id IS NOT NULL AND p.clinica_id IS NOT NULL;

-- Migrar usuários admin e recepcionistas para a primeira clínica
INSERT INTO public.usuarios_clinicas (usuario_id, clinica_id, tipo_papel)
SELECT 
  u.id,
  (SELECT id FROM public.clinicas LIMIT 1),
  CASE 
    WHEN u.tipo_usuario = 'admin' THEN 'admin_clinica'
    ELSE 'recepcionista'
  END
FROM public.users u
WHERE u.tipo_usuario IN ('admin', 'recepcionista')
AND NOT EXISTS (
  SELECT 1 FROM public.usuarios_clinicas uc WHERE uc.usuario_id = u.id
);

-- Função para obter clínicas do usuário
CREATE OR REPLACE FUNCTION public.get_user_clinicas()
RETURNS TABLE(clinica_id UUID, tipo_papel TEXT)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT uc.clinica_id, uc.tipo_papel
  FROM public.usuarios_clinicas uc
  WHERE uc.usuario_id = auth.uid() AND uc.ativo = true;
END;
$$;

-- Função para verificar se é admin da clínica
CREATE OR REPLACE FUNCTION public.is_admin_clinica(clinica_uuid UUID DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  -- Se não especificar clínica, verifica se é admin de qualquer clínica
  IF clinica_uuid IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.usuarios_clinicas uc
      WHERE uc.usuario_id = auth.uid() 
      AND uc.tipo_papel = 'admin_clinica'
      AND uc.ativo = true
    );
  END IF;
  
  -- Verifica se é admin da clínica específica
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios_clinicas uc
    WHERE uc.usuario_id = auth.uid() 
    AND uc.clinica_id = clinica_uuid
    AND uc.tipo_papel = 'admin_clinica'
    AND uc.ativo = true
  );
END;
$$;

-- Função para obter clínica atual do usuário (primeira encontrada)
CREATE OR REPLACE FUNCTION public.get_current_user_clinica()
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_clinica_id UUID;
BEGIN
  SELECT uc.clinica_id INTO user_clinica_id
  FROM public.usuarios_clinicas uc
  WHERE uc.usuario_id = auth.uid() AND uc.ativo = true
  LIMIT 1;
  
  RETURN user_clinica_id;
END;
$$;

-- Atualizar função get_current_profissional_id para considerar clínica
CREATE OR REPLACE FUNCTION public.get_current_profissional_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  prof_id UUID;
  user_clinica_id UUID;
BEGIN
  -- Obter clínica do usuário
  SELECT get_current_user_clinica() INTO user_clinica_id;
  
  -- Buscar profissional ativo na clínica
  SELECT p.id INTO prof_id
  FROM profissionais p 
  WHERE p.user_id = auth.uid() 
  AND p.ativo = true
  AND (user_clinica_id IS NULL OR p.clinica_id = user_clinica_id);
  
  RETURN prof_id;
END;
$$;

-- Atualizar função is_admin para considerar admin de clínica
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se é admin master (sistema) ou admin de clínica
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND tipo_usuario = 'admin'
  ) OR is_admin_clinica();
END;
$$;

-- Políticas RLS para usuarios_clinicas
CREATE POLICY "Usuários podem ver suas próprias associações"
ON public.usuarios_clinicas
FOR SELECT
USING (usuario_id = auth.uid() OR is_admin());

CREATE POLICY "Admin clínica pode gerenciar usuários da clínica"
ON public.usuarios_clinicas
FOR ALL
USING (
  is_admin() OR 
  (is_admin_clinica(clinica_id) AND clinica_id IN (SELECT clinica_id FROM get_user_clinicas()))
)
WITH CHECK (
  is_admin() OR 
  (is_admin_clinica(clinica_id) AND clinica_id IN (SELECT clinica_id FROM get_user_clinicas()))
);

-- Atualizar políticas RLS existentes para incluir isolamento por clínica

-- Pacientes: apenas da mesma clínica
DROP POLICY IF EXISTS "Pacientes visíveis por profissional responsável ou admin ou r" ON public.pacientes;
CREATE POLICY "Pacientes visíveis apenas da mesma clínica"
ON public.pacientes
FOR SELECT
USING (
  is_admin() OR 
  clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
);

DROP POLICY IF EXISTS "Admin e recepcionista podem atualizar pacientes" ON public.pacientes;
CREATE POLICY "Usuários da clínica podem atualizar pacientes"
ON public.pacientes
FOR UPDATE
USING (
  is_admin() OR 
  (clinica_id IN (SELECT clinica_id FROM get_user_clinicas()) AND 
   EXISTS (SELECT 1 FROM get_user_clinicas() WHERE tipo_papel IN ('admin_clinica', 'recepcionista')))
);

-- Agendamentos: apenas da mesma clínica
DROP POLICY IF EXISTS "Agendamentos visíveis por profissional responsável ou admin o" ON public.agendamentos;
CREATE POLICY "Agendamentos visíveis apenas da mesma clínica"
ON public.agendamentos
FOR SELECT
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM profissionais p 
    WHERE p.id = agendamentos.profissional_id 
    AND p.clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
  )
);

DROP POLICY IF EXISTS "Admin, recepcionista e profissional podem criar agendamentos" ON public.agendamentos;
CREATE POLICY "Usuários da clínica podem criar agendamentos"
ON public.agendamentos
FOR INSERT
WITH CHECK (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM profissionais p 
    WHERE p.id = agendamentos.profissional_id 
    AND p.clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
  )
);

DROP POLICY IF EXISTS "Admin, recepcionista e profissional responsável podem atualiza" ON public.agendamentos;
CREATE POLICY "Usuários da clínica podem atualizar agendamentos"
ON public.agendamentos
FOR UPDATE
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM profissionais p 
    WHERE p.id = agendamentos.profissional_id 
    AND p.clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
  )
);

-- Prontuários: apenas da mesma clínica
DROP POLICY IF EXISTS "Prontuários visíveis apenas por profissional responsável ou " ON public.prontuarios;
CREATE POLICY "Prontuários visíveis apenas da mesma clínica"
ON public.prontuarios
FOR SELECT
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM profissionais p 
    WHERE p.id = prontuarios.profissional_id 
    AND p.clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
  )
);

DROP POLICY IF EXISTS "Apenas profissional responsável ou admin podem gerenciar pront" ON public.prontuarios;
CREATE POLICY "Profissionais da clínica podem gerenciar prontuários"
ON public.prontuarios
FOR ALL
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM profissionais p 
    WHERE p.id = prontuarios.profissional_id 
    AND p.clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
    AND EXISTS (SELECT 1 FROM get_user_clinicas() WHERE tipo_papel = 'profissional')
  )
)
WITH CHECK (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM profissionais p 
    WHERE p.id = prontuarios.profissional_id 
    AND p.clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
    AND EXISTS (SELECT 1 FROM get_user_clinicas() WHERE tipo_papel = 'profissional')
  )
);

-- Pagamentos: apenas da mesma clínica
DROP POLICY IF EXISTS "Pagamentos visíveis por profissional responsável ou admin" ON public.pagamentos;
CREATE POLICY "Pagamentos visíveis apenas da mesma clínica"
ON public.pagamentos
FOR SELECT
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM agendamentos a
    JOIN profissionais p ON a.profissional_id = p.id
    WHERE a.id = pagamentos.agendamento_id 
    AND p.clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
  )
);

DROP POLICY IF EXISTS "Admin e profissional responsável podem gerenciar pagamentos" ON public.pagamentos;
CREATE POLICY "Usuários da clínica podem gerenciar pagamentos"
ON public.pagamentos
FOR ALL
USING (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM agendamentos a
    JOIN profissionais p ON a.profissional_id = p.id
    WHERE a.id = pagamentos.agendamento_id 
    AND p.clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
  )
)
WITH CHECK (
  is_admin() OR 
  EXISTS (
    SELECT 1 FROM agendamentos a
    JOIN profissionais p ON a.profissional_id = p.id
    WHERE a.id = pagamentos.agendamento_id 
    AND p.clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
  )
);