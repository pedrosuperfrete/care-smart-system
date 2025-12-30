-- Adicionar novo valor 'falta' ao enum status_agendamento
ALTER TYPE status_agendamento ADD VALUE IF NOT EXISTS 'falta';