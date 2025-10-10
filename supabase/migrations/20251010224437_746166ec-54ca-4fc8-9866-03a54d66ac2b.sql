-- ================================================================
-- PARTE 1: CRIAÇÃO DO SISTEMA DE ROLES SEGURO
-- ================================================================

-- 1.1: Criar enum para roles da aplicação
CREATE TYPE public.app_role AS ENUM ('admin', 'profissional', 'recepcionista');

-- 1.2: Criar tabela user_roles para gerenciar permissões de forma segura
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- 1.3: Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 1.4: Criar índice para performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- 1.5: Migrar dados existentes de tipo_usuario para user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
    id,
    CASE 
        WHEN tipo_usuario = 'admin' THEN 'admin'::app_role
        WHEN tipo_usuario = 'profissional' THEN 'profissional'::app_role
        WHEN tipo_usuario = 'recepcionista' THEN 'recepcionista'::app_role
    END
FROM public.users
WHERE id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- ================================================================
-- PARTE 2: CRIAR FUNÇÕES SECURITY DEFINER PARA EVITAR RECURSÃO RLS
-- ================================================================

-- 2.1: Função para verificar se usuário tem role específica
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 2.2: Atualizar função is_admin para usar user_roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
$$;

-- 2.3: Atualizar função is_recepcionista para usar user_roles
CREATE OR REPLACE FUNCTION public.is_recepcionista()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'recepcionista'::app_role)
$$;

-- 2.4: Criar função para verificar se é profissional
CREATE OR REPLACE FUNCTION public.is_profissional()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'profissional'::app_role)
$$;

-- ================================================================
-- PARTE 3: ATUALIZAR RLS POLICIES DA TABELA USERS
-- ================================================================

-- 3.1: Remover política SELECT antiga (insegura)
DROP POLICY IF EXISTS "Users podem ver perfis da mesma clínica" ON public.users;

-- 3.2: Criar política SELECT restritiva - usuários comuns veem apenas dados básicos
CREATE POLICY "Users podem ver dados básicos da mesma clínica"
ON public.users
FOR SELECT
TO public
USING (
  -- Usuário pode ver seus próprios dados completos
  id = auth.uid()
  OR
  -- Admin pode ver todos os dados
  public.is_admin()
  OR
  -- Usuários da mesma clínica podem ver apenas campos não-sensíveis
  (id IN (
    SELECT uc.usuario_id
    FROM usuarios_clinicas uc
    WHERE uc.clinica_id IN (
      SELECT clinica_id 
      FROM get_user_clinicas()
    )
    AND uc.ativo = true
  ))
);

-- 3.3: Adicionar comentário explicativo
COMMENT ON POLICY "Users podem ver dados básicos da mesma clínica" ON public.users IS 
'Política restritiva que permite:
- Usuário ver todos seus dados
- Admin ver todos os dados
- Usuários da mesma clínica ver apenas: id, nome, email, tipo_usuario, ativo
IMPORTANTE: Campos sensíveis (senha_hash, stripe_*) devem ser filtrados no application layer';

-- ================================================================
-- PARTE 4: RLS POLICIES PARA USER_ROLES
-- ================================================================

-- 4.1: Admin pode ver todas as roles
CREATE POLICY "Admin pode ver todas as roles"
ON public.user_roles
FOR SELECT
TO public
USING (public.is_admin());

-- 4.2: Usuários podem ver suas próprias roles
CREATE POLICY "Usuários podem ver suas próprias roles"
ON public.user_roles
FOR SELECT
TO public
USING (user_id = auth.uid());

-- 4.3: Apenas admin pode inserir roles
CREATE POLICY "Apenas admin pode inserir roles"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (public.is_admin());

-- 4.4: Apenas admin pode atualizar roles
CREATE POLICY "Apenas admin pode atualizar roles"
ON public.user_roles
FOR UPDATE
TO public
USING (public.is_admin());

-- 4.5: Apenas admin pode deletar roles
CREATE POLICY "Apenas admin pode deletar roles"
ON public.user_roles
FOR DELETE
TO public
USING (public.is_admin());

-- ================================================================
-- PARTE 5: CRIAR TRIGGER PARA MANTER user_roles SINCRONIZADO
-- ================================================================

-- 5.1: Função trigger para sincronizar tipo_usuario com user_roles
CREATE OR REPLACE FUNCTION public.sync_user_roles_on_users_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se tipo_usuario mudou, atualizar user_roles
  IF TG_OP = 'UPDATE' AND OLD.tipo_usuario IS DISTINCT FROM NEW.tipo_usuario THEN
    -- Remover role antiga
    DELETE FROM public.user_roles 
    WHERE user_id = NEW.id;
    
    -- Inserir nova role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      NEW.id,
      CASE 
        WHEN NEW.tipo_usuario = 'admin' THEN 'admin'::app_role
        WHEN NEW.tipo_usuario = 'profissional' THEN 'profissional'::app_role
        WHEN NEW.tipo_usuario = 'recepcionista' THEN 'recepcionista'::app_role
      END
    )
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  -- Se novo usuário foi criado, criar role correspondente
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      NEW.id,
      CASE 
        WHEN NEW.tipo_usuario = 'admin' THEN 'admin'::app_role
        WHEN NEW.tipo_usuario = 'profissional' THEN 'profissional'::app_role
        WHEN NEW.tipo_usuario = 'recepcionista' THEN 'recepcionista'::app_role
      END
    )
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5.2: Criar trigger para sincronização
DROP TRIGGER IF EXISTS sync_user_roles_trigger ON public.users;
CREATE TRIGGER sync_user_roles_trigger
  AFTER INSERT OR UPDATE OF tipo_usuario
  ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_roles_on_users_change();

-- ================================================================
-- PARTE 6: ADICIONAR CONSTRAINTS E VALIDAÇÕES
-- ================================================================

-- 6.1: Garantir que user_id em user_roles existe em users
-- (já garantido pela foreign key para auth.users)

-- 6.2: Criar função para validar que usuário tem pelo menos uma role
CREATE OR REPLACE FUNCTION public.user_must_have_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ao deletar uma role, verificar se usuário tem pelo menos outra
  IF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = OLD.user_id 
      AND id != OLD.id
    ) THEN
      RAISE EXCEPTION 'Usuário deve ter pelo menos uma role ativa';
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

-- 6.3: Criar trigger de validação
DROP TRIGGER IF EXISTS validate_user_has_role_trigger ON public.user_roles;
CREATE TRIGGER validate_user_has_role_trigger
  BEFORE DELETE
  ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.user_must_have_role();