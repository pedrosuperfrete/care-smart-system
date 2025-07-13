-- Remover primeiro todos os triggers
DROP TRIGGER IF EXISTS trigger_sync_agendamento_google_calendar ON public.agendamentos;
DROP TRIGGER IF EXISTS sync_agendamento_update_to_google_calendar ON public.agendamentos;
DROP TRIGGER IF EXISTS sync_agendamento_delete_to_google_calendar ON public.agendamentos;

-- Agora remover as funções
DROP FUNCTION IF EXISTS public.sync_agendamento_to_google_calendar() CASCADE;
DROP FUNCTION IF EXISTS public.sync_agendamento_update_to_google_calendar() CASCADE;
DROP FUNCTION IF EXISTS public.sync_agendamento_delete_to_google_calendar() CASCADE;