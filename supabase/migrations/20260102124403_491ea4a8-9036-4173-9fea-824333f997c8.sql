-- Adicionar campo de taxa de imposto na tabela clinicas
ALTER TABLE public.clinicas 
ADD COLUMN taxa_imposto numeric DEFAULT 0;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.clinicas.taxa_imposto IS 'Percentual de imposto sobre o faturamento (ex: 6 para 6%). Só é relevante quando há CNPJ cadastrado.';