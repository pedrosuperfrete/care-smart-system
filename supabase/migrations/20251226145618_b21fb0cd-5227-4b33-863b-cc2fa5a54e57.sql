-- Create unique constraint on cpf + clinica_id for upsert to work
ALTER TABLE public.pacientes 
ADD CONSTRAINT pacientes_cpf_clinica_unique UNIQUE (cpf, clinica_id);