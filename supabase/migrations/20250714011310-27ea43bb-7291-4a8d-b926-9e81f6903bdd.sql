-- Adicionar campos de assinatura na tabela profissionais
ALTER TABLE public.profissionais 
ADD COLUMN IF NOT EXISTS assinatura_ativa BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS data_vencimento_assinatura TIMESTAMPTZ;