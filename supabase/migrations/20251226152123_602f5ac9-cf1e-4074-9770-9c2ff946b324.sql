-- Tornar CPF nullable na tabela pacientes
ALTER TABLE public.pacientes ALTER COLUMN cpf DROP NOT NULL;

-- Criar índice único parcial: CPF único por clínica apenas quando preenchido
-- Isso permite múltiplos NULLs mas impede CPFs duplicados na mesma clínica
CREATE UNIQUE INDEX idx_pacientes_cpf_clinica_unique 
ON public.pacientes (cpf, clinica_id) 
WHERE cpf IS NOT NULL AND cpf != '';