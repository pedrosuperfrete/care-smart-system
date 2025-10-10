-- Add new address fields to pacientes table
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT;

COMMENT ON COLUMN pacientes.endereco IS 'Rua, número e complemento';
COMMENT ON COLUMN pacientes.cep IS 'CEP do paciente';
COMMENT ON COLUMN pacientes.cidade IS 'Cidade do paciente';
COMMENT ON COLUMN pacientes.estado IS 'Estado do paciente (UF)';