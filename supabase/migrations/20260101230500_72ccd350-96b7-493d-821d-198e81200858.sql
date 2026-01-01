-- Tabela para despesas avulsas/pontuais
CREATE TABLE public.despesas_avulsas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'outros',
  data_pagamento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca por clínica e data
CREATE INDEX idx_despesas_avulsas_clinica_data ON public.despesas_avulsas(clinica_id, data_pagamento);

-- Habilitar RLS
ALTER TABLE public.despesas_avulsas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários da clínica podem ver despesas avulsas"
ON public.despesas_avulsas
FOR SELECT
USING (
  is_admin() OR 
  clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
);

CREATE POLICY "Usuários da clínica podem criar despesas avulsas"
ON public.despesas_avulsas
FOR INSERT
WITH CHECK (
  is_admin() OR 
  clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
);

CREATE POLICY "Usuários da clínica podem atualizar despesas avulsas"
ON public.despesas_avulsas
FOR UPDATE
USING (
  is_admin() OR 
  clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
);

CREATE POLICY "Usuários da clínica podem deletar despesas avulsas"
ON public.despesas_avulsas
FOR DELETE
USING (
  is_admin() OR 
  clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
);

-- Trigger para atualizar atualizado_em
CREATE TRIGGER update_despesas_avulsas_updated_at
  BEFORE UPDATE ON public.despesas_avulsas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();