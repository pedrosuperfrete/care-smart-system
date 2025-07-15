-- Verificar se existe o trigger que cria profissionais automaticamente
DROP TRIGGER IF EXISTS create_default_profissional_trigger ON public.users;

-- Remover a função que cria profissionais automaticamente
DROP FUNCTION IF EXISTS public.create_default_profissional();