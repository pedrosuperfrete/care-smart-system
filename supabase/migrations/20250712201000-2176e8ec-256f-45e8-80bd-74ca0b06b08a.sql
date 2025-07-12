-- Adicionar campo para armazenar o refresh token do Google para cada profissional
ALTER TABLE public.profissionais 
ADD COLUMN google_refresh_token TEXT;

-- Adicionar comentário explicando o campo
COMMENT ON COLUMN public.profissionais.google_refresh_token IS 'Token de refresh do Google para integração com Google Calendar';