-- ================================================================
-- CORREÇÃO DEFINITIVA: VIEW SEGURA PARA PROTEGER CAMPOS SENSÍVEIS
-- (Versão Corrigida - Views não podem ter políticas RLS)
-- ================================================================

-- 1. Criar VIEW com apenas campos não-sensíveis da tabela users
CREATE OR REPLACE VIEW public.users_safe AS
SELECT 
  id,
  email,
  nome,
  tipo_usuario,
  ativo,
  criado_em,
  plano,
  subscription_end_date
  -- CAMPOS EXCLUÍDOS (nunca expostos):
  -- senha_hash
  -- stripe_customer_id
  -- subscription_id
  -- subscription_status
FROM public.users;

-- 2. Fazer view usar security_invoker (aplica RLS da tabela base)
ALTER VIEW public.users_safe SET (security_invoker = true);

-- 3. Comentário de documentação
COMMENT ON VIEW public.users_safe IS 
'View segura da tabela users que exclui campos sensíveis.
NUNCA expõe: senha_hash, stripe_customer_id, subscription_id, subscription_status.
Use esta view em vez de acessar users diretamente para dados não-sensíveis.
A view herda as políticas RLS da tabela users (security_invoker = true).';

-- ================================================================
-- CRIAR FUNÇÃO AUXILIAR PARA OBTER DADOS SEGUROS
-- ================================================================

-- 4. Criar função auxiliar para obter dados seguros de usuários
CREATE OR REPLACE FUNCTION public.get_safe_user_profile(_user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  nome TEXT,
  tipo_usuario tipo_usuario,
  ativo BOOLEAN,
  criado_em TIMESTAMP WITH TIME ZONE,
  plano TEXT,
  subscription_end_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    email,
    nome,
    tipo_usuario,
    ativo,
    criado_em,
    plano,
    subscription_end_date
  FROM public.users
  WHERE id = _user_id
  -- Aplicar as mesmas regras da política RLS manualmente
  AND (
    _user_id = auth.uid()
    OR public.is_admin()
    OR _user_id IN (
      SELECT uc.usuario_id
      FROM usuarios_clinicas uc
      WHERE uc.clinica_id IN (
        SELECT clinica_id 
        FROM get_user_clinicas()
      )
      AND uc.ativo = true
    )
  );
$$;

-- 5. Comentário de documentação para a função
COMMENT ON FUNCTION public.get_safe_user_profile IS 
'Retorna dados seguros de um usuário específico, excluindo campos sensíveis.
Use esta função quando precisar buscar dados de usuário de forma segura.
Aplica as mesmas regras de RLS da tabela users.';

-- ================================================================
-- ADICIONAR GRANTS APROPRIADOS
-- ================================================================

-- 6. Garantir que usuários autenticados possam acessar a view segura
GRANT SELECT ON public.users_safe TO authenticated;
GRANT SELECT ON public.users_safe TO anon;

-- ================================================================
-- DOCUMENTAÇÃO E AVISOS
-- ================================================================

-- 7. Documentação adicional na tabela users
COMMENT ON TABLE public.users IS 
'⚠️ ATENÇÃO: Esta tabela contém dados EXTREMAMENTE sensíveis:
- senha_hash: Hash de senhas (NUNCA deve ser exposto)
- stripe_customer_id: ID do cliente no Stripe (informação de pagamento)
- subscription_id: ID da assinatura (informação de pagamento)
- subscription_status: Status da assinatura (informação de pagamento)

📋 REGRAS DE ACESSO:
1. NUNCA use SELECT * FROM users na aplicação
2. SEMPRE use a view users_safe para dados não-sensíveis
3. OU use a função get_safe_user_profile() para buscar dados de usuário específico
4. Apenas operações administrativas críticas devem acessar campos sensíveis diretamente

🔒 POLÍTICAS RLS ATIVAS:
- Usuários podem ver apenas seus próprios dados completos
- Admins podem ver todos os dados
- Usuários da mesma clínica podem ver dados básicos (via view users_safe)';

-- ================================================================
-- CRIAR FUNÇÃO PARA LISTAR USUÁRIOS DA CLÍNICA DE FORMA SEGURA
-- ================================================================

-- 8. Função para listar usuários da clínica sem expor dados sensíveis
CREATE OR REPLACE FUNCTION public.get_clinic_users_safe()
RETURNS TABLE (
  id UUID,
  email TEXT,
  nome TEXT,
  tipo_usuario tipo_usuario,
  ativo BOOLEAN,
  criado_em TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id,
    u.email,
    u.nome,
    u.tipo_usuario,
    u.ativo,
    u.criado_em
  FROM public.users u
  WHERE u.id IN (
    SELECT uc.usuario_id
    FROM usuarios_clinicas uc
    WHERE uc.clinica_id IN (
      SELECT clinica_id 
      FROM get_user_clinicas()
    )
    AND uc.ativo = true
  )
  -- Campos sensíveis NUNCA são retornados
  ORDER BY u.nome, u.email;
$$;

COMMENT ON FUNCTION public.get_clinic_users_safe IS 
'Lista todos os usuários da clínica atual de forma segura.
Retorna apenas campos não-sensíveis.
NUNCA expõe: senha_hash, stripe_customer_id, subscription_id, subscription_status.';

-- ================================================================
-- PROTEÇÃO ADICIONAL: DOCUMENTAÇÃO DE CAMPOS
-- ================================================================

-- 9. Adicionar comentários nos campos sensíveis
COMMENT ON COLUMN public.users.senha_hash IS '🔒 CAMPO EXTREMAMENTE SENSÍVEL - Hash de senha. NUNCA deve ser exposto em queries. Use users_safe view.';
COMMENT ON COLUMN public.users.stripe_customer_id IS '🔒 CAMPO SENSÍVEL - ID do cliente Stripe. Contém informação de pagamento. Use users_safe view.';
COMMENT ON COLUMN public.users.subscription_id IS '🔒 CAMPO SENSÍVEL - ID da assinatura. Contém informação de pagamento. Use users_safe view.';
COMMENT ON COLUMN public.users.subscription_status IS '🔒 CAMPO SENSÍVEL - Status da assinatura. Pode revelar informação financeira. Use users_safe view.';