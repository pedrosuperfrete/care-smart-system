-- Adicionar coluna de parcelas na tabela despesas_avulsas
ALTER TABLE public.despesas_avulsas 
ADD COLUMN parcelas integer DEFAULT 1;

COMMENT ON COLUMN public.despesas_avulsas.parcelas IS 'Número de parcelas da despesa';