-- Adicionar coluna para armazenar o ID do evento do Google Calendar
ALTER TABLE agendamentos ADD COLUMN google_event_id TEXT;

-- Adicionar índice para melhorar performance nas consultas
CREATE INDEX idx_agendamentos_google_event_id ON agendamentos(google_event_id);