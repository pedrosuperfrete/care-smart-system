-- Tabela para registrar pagamentos reais de custos recorrentes por mês
CREATE TABLE public.custos_pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custo_id UUID NOT NULL REFERENCES public.custos(id) ON DELETE CASCADE,
  clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  mes_referencia TEXT NOT NULL, -- formato: '2025-11' (ano-mês)
  valor_pago NUMERIC NOT NULL DEFAULT 0,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'pago', 'estimado'
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(custo_id, mes_referencia)
);

-- Índices para performance
CREATE INDEX idx_custos_pagamentos_clinica_mes ON public.custos_pagamentos(clinica_id, mes_referencia);
CREATE INDEX idx_custos_pagamentos_custo ON public.custos_pagamentos(custo_id);

-- Enable RLS
ALTER TABLE public.custos_pagamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários da clínica podem ver pagamentos de custos"
ON public.custos_pagamentos FOR SELECT
USING (
  is_admin() OR 
  clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
);

CREATE POLICY "Usuários da clínica podem criar pagamentos de custos"
ON public.custos_pagamentos FOR INSERT
WITH CHECK (
  is_admin() OR 
  clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
);

CREATE POLICY "Usuários da clínica podem atualizar pagamentos de custos"
ON public.custos_pagamentos FOR UPDATE
USING (
  is_admin() OR 
  clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
);

CREATE POLICY "Usuários da clínica podem deletar pagamentos de custos"
ON public.custos_pagamentos FOR DELETE
USING (
  is_admin() OR 
  clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
);

-- Trigger para atualizar atualizado_em
CREATE TRIGGER update_custos_pagamentos_updated_at
BEFORE UPDATE ON public.custos_pagamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campo valor_estimado na tabela custos (valor de referência para projeções)
ALTER TABLE public.custos 
  RENAME COLUMN valor TO valor_estimado;

-- Adicionar comentário para clareza
COMMENT ON COLUMN public.custos.valor_estimado IS 'Valor estimado mensal para projeções. O valor real é registrado em custos_pagamentos.';