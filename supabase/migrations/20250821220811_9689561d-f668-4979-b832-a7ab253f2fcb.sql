-- Primeiro vamos criar o novo enum para tipo de paciente
CREATE TYPE tipo_paciente AS ENUM ('novo', 'recorrente', 'antigo');

-- Adicionar nova coluna tipo_paciente
ALTER TABLE pacientes ADD COLUMN tipo_paciente tipo_paciente DEFAULT 'novo';

-- Migrar dados existentes baseado no risco
UPDATE pacientes SET tipo_paciente = CASE 
  WHEN risco = 'baixo' THEN 'novo'::tipo_paciente
  WHEN risco = 'medio' THEN 'recorrente'::tipo_paciente  
  WHEN risco = 'alto' THEN 'antigo'::tipo_paciente
  ELSE 'novo'::tipo_paciente
END;

-- Tornar a coluna NOT NULL após migrar os dados
ALTER TABLE pacientes ALTER COLUMN tipo_paciente SET NOT NULL;

-- Remover a coluna risco antiga
ALTER TABLE pacientes DROP COLUMN risco;

-- Remover o tipo enum antigo (se não for usado em outras tabelas)
DROP TYPE IF EXISTS risco_paciente;