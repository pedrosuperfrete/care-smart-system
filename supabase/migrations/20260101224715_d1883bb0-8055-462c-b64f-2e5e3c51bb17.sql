-- Tabela de custos fixos e variáveis
CREATE TABLE public.custos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  tipo TEXT NOT NULL CHECK (tipo IN ('fixo', 'variavel')),
  frequencia TEXT NOT NULL DEFAULT 'mensal' CHECK (frequencia IN ('mensal', 'por_atendimento', 'ocasional')),
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice por clínica
CREATE INDEX idx_custos_clinica ON public.custos(clinica_id);

-- Comentário
COMMENT ON TABLE public.custos IS 'Custos fixos e variáveis da clínica para cálculo de rentabilidade';

-- Enable RLS
ALTER TABLE public.custos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - todos da clínica podem ver e gerenciar
CREATE POLICY "Usuários da clínica podem ver custos"
ON public.custos
FOR SELECT
USING (
  is_admin() OR
  clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
);

CREATE POLICY "Usuários da clínica podem criar custos"
ON public.custos
FOR INSERT
WITH CHECK (
  is_admin() OR
  clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
);

CREATE POLICY "Usuários da clínica podem atualizar custos"
ON public.custos
FOR UPDATE
USING (
  is_admin() OR
  clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
);

CREATE POLICY "Usuários da clínica podem deletar custos"
ON public.custos
FOR DELETE
USING (
  is_admin() OR
  clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
);

-- Trigger para updated_at
CREATE TRIGGER update_custos_updated_at
BEFORE UPDATE ON public.custos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de associação custo <-> serviço (muitos-para-muitos)
CREATE TABLE public.custos_servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custo_id UUID NOT NULL REFERENCES public.custos(id) ON DELETE CASCADE,
  tipo_servico_id UUID NOT NULL REFERENCES public.tipos_servicos(id) ON DELETE CASCADE,
  tipo_aplicacao TEXT NOT NULL DEFAULT 'integral' CHECK (tipo_aplicacao IN ('integral', 'rateio')),
  percentual_rateio NUMERIC DEFAULT 100,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(custo_id, tipo_servico_id)
);

-- Índices
CREATE INDEX idx_custos_servicos_custo ON public.custos_servicos(custo_id);
CREATE INDEX idx_custos_servicos_servico ON public.custos_servicos(tipo_servico_id);

-- Comentário
COMMENT ON TABLE public.custos_servicos IS 'Associação de custos a serviços específicos para rateio';

-- Enable RLS
ALTER TABLE public.custos_servicos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver custos_servicos da clínica"
ON public.custos_servicos
FOR SELECT
USING (
  is_admin() OR
  custo_id IN (
    SELECT c.id FROM custos c 
    WHERE c.clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
  )
);

CREATE POLICY "Usuários podem criar custos_servicos da clínica"
ON public.custos_servicos
FOR INSERT
WITH CHECK (
  is_admin() OR
  custo_id IN (
    SELECT c.id FROM custos c 
    WHERE c.clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
  )
);

CREATE POLICY "Usuários podem atualizar custos_servicos da clínica"
ON public.custos_servicos
FOR UPDATE
USING (
  is_admin() OR
  custo_id IN (
    SELECT c.id FROM custos c 
    WHERE c.clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
  )
);

CREATE POLICY "Usuários podem deletar custos_servicos da clínica"
ON public.custos_servicos
FOR DELETE
USING (
  is_admin() OR
  custo_id IN (
    SELECT c.id FROM custos c 
    WHERE c.clinica_id IN (SELECT clinica_id FROM get_user_clinicas())
  )
);