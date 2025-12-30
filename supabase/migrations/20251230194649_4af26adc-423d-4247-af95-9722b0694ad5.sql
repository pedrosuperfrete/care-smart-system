-- Adicionar coluna para serviços adicionais em agendamentos
ALTER TABLE public.agendamentos
ADD COLUMN servicos_adicionais jsonb DEFAULT '[]'::jsonb;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.agendamentos.servicos_adicionais IS 'Array de serviços adicionais: [{nome: string, valor: number}]';