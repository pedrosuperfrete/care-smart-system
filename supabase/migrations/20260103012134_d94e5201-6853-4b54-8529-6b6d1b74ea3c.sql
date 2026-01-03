-- Adicionar colunas para permitir escolher entre % ou R$ nas cobranças
ALTER TABLE public.tipos_servicos 
ADD COLUMN IF NOT EXISTS tipo_cobranca_agendamento TEXT DEFAULT 'percentual' CHECK (tipo_cobranca_agendamento IN ('percentual', 'valor_fixo')),
ADD COLUMN IF NOT EXISTS valor_cobranca_agendamento NUMERIC,
ADD COLUMN IF NOT EXISTS tipo_cobranca_falta TEXT DEFAULT 'percentual' CHECK (tipo_cobranca_falta IN ('percentual', 'valor_fixo')),
ADD COLUMN IF NOT EXISTS valor_cobranca_falta NUMERIC;

-- Comentários para documentar
COMMENT ON COLUMN public.tipos_servicos.tipo_cobranca_agendamento IS 'Tipo de cobrança no agendamento: percentual ou valor_fixo';
COMMENT ON COLUMN public.tipos_servicos.valor_cobranca_agendamento IS 'Valor fixo da cobrança no agendamento (usado quando tipo = valor_fixo)';
COMMENT ON COLUMN public.tipos_servicos.tipo_cobranca_falta IS 'Tipo de cobrança em caso de falta: percentual ou valor_fixo';
COMMENT ON COLUMN public.tipos_servicos.valor_cobranca_falta IS 'Valor fixo da cobrança em caso de falta (usado quando tipo = valor_fixo)';