-- Adicionar colunas de taxa de cartão na tabela clinicas
ALTER TABLE public.clinicas 
ADD COLUMN taxa_cartao_credito numeric DEFAULT 0,
ADD COLUMN taxa_cartao_debito numeric DEFAULT 0;

-- Comentários para documentação
COMMENT ON COLUMN public.clinicas.taxa_cartao_credito IS 'Percentual da taxa de cartão de crédito';
COMMENT ON COLUMN public.clinicas.taxa_cartao_debito IS 'Percentual da taxa de cartão de débito';