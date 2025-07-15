-- Primeiro remover o trigger
DROP TRIGGER IF EXISTS trigger_create_profissional ON auth.users;

-- Depois remover a função
DROP FUNCTION IF EXISTS public.create_default_profissional() CASCADE;