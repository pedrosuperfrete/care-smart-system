-- Adicionar campos de cobrança por falta e por agendamento
ALTER TABLE tipos_servicos 
ADD COLUMN IF NOT EXISTS percentual_cobranca_falta numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS percentual_cobranca_agendamento numeric DEFAULT NULL;

-- Comentários para documentação
COMMENT ON COLUMN tipos_servicos.percentual_cobranca_falta IS 'Percentual do valor do serviço a ser cobrado em caso de falta do paciente (0-100)';
COMMENT ON COLUMN tipos_servicos.percentual_cobranca_agendamento IS 'Percentual do valor do serviço a ser cobrado na hora do agendamento (0-100)';