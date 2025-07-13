-- Criar função para sincronizar agendamento com Google Calendar
CREATE OR REPLACE FUNCTION sync_agendamento_to_google_calendar()
RETURNS TRIGGER AS $$
BEGIN
  -- Só sincronizar se não tiver google_event_id (inserção manual)
  IF NEW.google_event_id IS NULL AND NOT NEW.desmarcada THEN
    -- Chamar a função edge do Google Calendar de forma assíncrona
    PERFORM
      net.http_post(
        url := 'https://zxgkspeehamsrfhynbzr.supabase.co/functions/v1/google-calendar',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4Z2tzcGVlaGFtc3JmaHluYnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEyMjkxMiwiZXhwIjoyMDY1Njk4OTEyfQ.WtBFZ_v0d_Lv1TqQJV7XFCojgFb9xfnV-DcRaGp9iJ4'
        ),
        body := jsonb_build_object(
          'action', 'create',
          'agendamento_id', NEW.id
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para sincronização automática
CREATE TRIGGER trigger_sync_agendamento_google_calendar
  AFTER INSERT ON agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION sync_agendamento_to_google_calendar();

-- Também criar trigger para atualizações
CREATE OR REPLACE FUNCTION sync_agendamento_update_to_google_calendar()
RETURNS TRIGGER AS $$
BEGIN
  -- Se foi desmarcado, deletar do Google Calendar
  IF NEW.desmarcada = true AND OLD.desmarcada = false AND OLD.google_event_id IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := 'https://zxgkspeehamsrfhynbzr.supabase.co/functions/v1/google-calendar',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4Z2tzcGVlaGFtc3JmaHluYnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEyMjkxMiwiZXhwIjoyMDY1Njk4OTEyfQ.WtBFZ_v0d_Lv1TqQJV7XFCojgFb9xfnV-DcRaGp9iJ4'
        ),
        body := jsonb_build_object(
          'action', 'delete',
          'agendamento_id', NEW.id
        )
      );
  -- Se houve mudança nas datas/horários e tem google_event_id, atualizar
  ELSIF (NEW.data_inicio != OLD.data_inicio OR NEW.data_fim != OLD.data_fim OR NEW.tipo_servico != OLD.tipo_servico) 
        AND NEW.google_event_id IS NOT NULL AND NOT NEW.desmarcada THEN
    PERFORM
      net.http_post(
        url := 'https://zxgkspeehamsrfhynbzr.supabase.co/functions/v1/google-calendar',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4Z2tzcGVlaGFtc3JmaHluYnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEyMjkxMiwiZXhwIjoyMDY1Njk4OTEyfQ.WtBFZ_v0d_Lv1TqQJV7XFCojgFb9xfnV-DcRaGp9iJ4'
        ),
        body := jsonb_build_object(
          'action', 'update',
          'agendamento_id', NEW.id
        )
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_agendamento_update_google_calendar
  AFTER UPDATE ON agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION sync_agendamento_update_to_google_calendar();