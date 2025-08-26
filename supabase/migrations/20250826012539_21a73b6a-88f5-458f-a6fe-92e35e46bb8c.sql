-- Criar tabela para tipos de serviços centralizados
CREATE TABLE public.tipos_servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco DECIMAL(10,2),
  ativo BOOLEAN NOT NULL DEFAULT true,
  clinica_id UUID,
  profissional_id UUID,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tipos_servicos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Tipos de serviço visíveis da mesma clínica"
ON public.tipos_servicos
FOR SELECT
USING (
  is_admin() OR 
  (clinica_id IN (SELECT clinica_id FROM get_user_clinicas())) OR
  (profissional_id = get_current_profissional_id())
);

CREATE POLICY "Profissionais podem gerenciar seus tipos de serviço"
ON public.tipos_servicos
FOR ALL
USING (
  is_admin() OR 
  (profissional_id = get_current_profissional_id()) OR
  (clinica_id IN (SELECT clinica_id FROM get_user_clinicas()) AND EXISTS(
    SELECT 1 FROM get_user_clinicas() 
    WHERE tipo_papel IN ('admin_clinica', 'profissional')
  ))
)
WITH CHECK (
  is_admin() OR 
  (profissional_id = get_current_profissional_id()) OR
  (clinica_id IN (SELECT clinica_id FROM get_user_clinicas()) AND EXISTS(
    SELECT 1 FROM get_user_clinicas() 
    WHERE tipo_papel IN ('admin_clinica', 'profissional')
  ))
);

-- Criar trigger para atualizar timestamp
CREATE TRIGGER update_tipos_servicos_updated_at
BEFORE UPDATE ON public.tipos_servicos
FOR EACH ROW
EXECUTE FUNCTION public.trigger_atualizado_em();

-- Migrar dados existentes de servicos_precos para tipos_servicos
-- Este script irá buscar todos os profissionais e seus serviços cadastrados
INSERT INTO public.tipos_servicos (nome, preco, clinica_id, profissional_id)
SELECT 
  servico->>'nome' as nome,
  CASE 
    WHEN servico->>'preco' ~ '^[0-9]+([,\.][0-9]+)?$' 
    THEN CAST(REPLACE(servico->>'preco', ',', '.') AS DECIMAL(10,2))
    ELSE NULL
  END as preco,
  p.clinica_id,
  p.id as profissional_id
FROM profissionais p,
LATERAL jsonb_array_elements(COALESCE(p.servicos_precos, '[]'::jsonb)) AS servico
WHERE servico->>'nome' IS NOT NULL 
AND servico->>'nome' != '';

-- Criar alguns tipos de serviços padrão do sistema se não existirem
INSERT INTO public.tipos_servicos (nome, ativo, clinica_id, profissional_id)
SELECT nome, true, NULL, NULL FROM (
  VALUES 
    ('Consulta'),
    ('Retorno'),
    ('Exame'),
    ('Procedimento'),
    ('Emergência')
) AS default_services(nome)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tipos_servicos ts 
  WHERE ts.nome = default_services.nome 
  AND ts.clinica_id IS NULL 
  AND ts.profissional_id IS NULL
);