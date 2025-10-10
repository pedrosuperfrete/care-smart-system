-- Add bairro field to pacientes table
ALTER TABLE pacientes 
ADD COLUMN IF NOT EXISTS bairro TEXT;

COMMENT ON COLUMN pacientes.bairro IS 'Bairro do paciente';