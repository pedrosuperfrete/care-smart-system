-- Adiciona coluna para rastrear quando o onboarding foi adiado
ALTER TABLE public.profissionais 
ADD COLUMN IF NOT EXISTS onboarding_adiado_em timestamp with time zone DEFAULT NULL;

-- Cria índice para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_profissionais_onboarding_adiado 
ON public.profissionais(onboarding_adiado_em) 
WHERE onboarding_adiado_em IS NOT NULL;