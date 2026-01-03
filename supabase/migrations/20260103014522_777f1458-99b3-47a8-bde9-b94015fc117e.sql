-- Adicionar campos de configuração de Nota Fiscal na tabela clinicas
ALTER TABLE public.clinicas
ADD COLUMN IF NOT EXISTS nf_cidade_emissao text,
ADD COLUMN IF NOT EXISTS nf_inscricao_municipal text,
ADD COLUMN IF NOT EXISTS nf_regime_tributario text DEFAULT 'simples',
ADD COLUMN IF NOT EXISTS nf_codigo_servico text,
ADD COLUMN IF NOT EXISTS nf_descricao_servico text;