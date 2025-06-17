
-- Adicionar campo desmarcada na tabela agendamentos
ALTER TABLE public.agendamentos 
ADD COLUMN desmarcada BOOLEAN NOT NULL DEFAULT false;
