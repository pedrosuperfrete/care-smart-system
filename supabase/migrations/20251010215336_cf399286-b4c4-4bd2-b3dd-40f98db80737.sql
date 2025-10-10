-- Adicionar coluna origem à tabela pacientes
ALTER TABLE pacientes 
ADD COLUMN origem TEXT;

COMMENT ON COLUMN pacientes.origem IS 'Origem do paciente: Indicação amigo, Indicação paciente, Instagram, Google, Marketing, Outros';