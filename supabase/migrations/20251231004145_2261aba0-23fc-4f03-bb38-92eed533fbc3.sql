-- Adicionar campos de dados bancários na tabela profissionais
ALTER TABLE public.profissionais 
ADD COLUMN IF NOT EXISTS pix_chave text,
ADD COLUMN IF NOT EXISTS conta_bancaria text;