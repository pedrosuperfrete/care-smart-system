-- Remover os triggers que causam erro do schema net
DROP TRIGGER IF EXISTS sync_agendamento_to_google_calendar ON public.agendamentos;
DROP TRIGGER IF EXISTS sync_agendamento_update_to_google_calendar ON public.agendamentos;
DROP TRIGGER IF EXISTS sync_agendamento_delete_to_google_calendar ON public.agendamentos;

-- Remover as funções que usam net.http_post
DROP FUNCTION IF EXISTS public.sync_agendamento_to_google_calendar();
DROP FUNCTION IF EXISTS public.sync_agendamento_update_to_google_calendar();
DROP FUNCTION IF EXISTS public.sync_agendamento_delete_to_google_calendar();