-- Corrige profissionais que pularam onboarding antes da nova lógica
-- (onboarding_completo = true mas dados incompletos = nome vazio)
UPDATE public.profissionais
SET 
  onboarding_completo = false,
  onboarding_adiado_em = now()
WHERE 
  onboarding_completo = true 
  AND (nome IS NULL OR nome = '')
  AND onboarding_adiado_em IS NULL;