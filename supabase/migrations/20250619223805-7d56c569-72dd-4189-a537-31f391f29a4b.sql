
-- Adicionar campos de assinatura na tabela users
ALTER TABLE public.users 
ADD COLUMN plano TEXT DEFAULT 'free' CHECK (plano IN ('free', 'pro')),
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN subscription_status TEXT,
ADD COLUMN subscription_id TEXT,
ADD COLUMN subscription_end_date TIMESTAMPTZ;

-- Criar tabela para histórico de pagamentos
CREATE TABLE public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  status TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS na tabela payment_history
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seu próprio histórico
CREATE POLICY "Users can view own payment history" ON public.payment_history
FOR SELECT USING (user_id = auth.uid());

-- Política para inserção (edge functions usarão service role)
CREATE POLICY "Allow payment history inserts" ON public.payment_history
FOR INSERT WITH CHECK (true);

-- Política para updates (edge functions usarão service role)
CREATE POLICY "Allow payment history updates" ON public.payment_history
FOR UPDATE USING (true);
