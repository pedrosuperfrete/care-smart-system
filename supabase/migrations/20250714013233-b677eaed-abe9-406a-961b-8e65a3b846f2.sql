-- Adicionar campo stripe_status na tabela profissionais
ALTER TABLE public.profissionais 
ADD COLUMN IF NOT EXISTS stripe_status TEXT DEFAULT NULL;