-- Criar função para sincronizar deleção de agendamento com Google Calendar
CREATE OR REPLACE FUNCTION sync_agendamento_delete_to_google_calendar()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o agendamento deletado tinha google_event_id, deletar do Google Calendar
  IF OLD.google_event_id IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := 'https://zxgkspeehamsrfhynbzr.supabase.co/functions/v1/google-calendar',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4Z2tzcGVlaGFtc3JmaHluYnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEyMjkxMiwiZXhwIjoyMDY1Njk4OTEyfQ.WtBFZ_v0d_Lv1TqQJV7XFCojgFb9xfnV-DcRaGp9iJ4'
        ),
        body := jsonb_build_object(
          'action', 'delete',
          'agendamento_id', OLD.id
        )
      );
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para sincronização automática de deleções
CREATE TRIGGER trigger_sync_agendamento_delete_google_calendar
  AFTER DELETE ON agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION sync_agendamento_delete_to_google_calendar();