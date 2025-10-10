-- Adicionar coluna modalidade_atendimento à tabela pacientes
ALTER TABLE pacientes 
ADD COLUMN modalidade_atendimento TEXT;

COMMENT ON COLUMN pacientes.modalidade_atendimento IS 'Modalidade do atendimento: Atendimento pelo plano, Particular com reembolso, Particular';