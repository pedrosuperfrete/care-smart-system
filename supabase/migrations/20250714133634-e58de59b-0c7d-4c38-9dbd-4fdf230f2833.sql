-- Criar tabela para gerenciar profissionais conectados ao WhatsApp
CREATE TABLE public.whatsapp_profissionais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  numero_telefone TEXT NOT NULL, -- sem formatação, ex: 5511999999999
  api_key_n8n TEXT, -- opcional, se cada profissional tiver key própria
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profissional_id) -- um profissional pode ter apenas um número WhatsApp conectado
);

-- Enable RLS
ALTER TABLE public.whatsapp_profissionais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_profissionais
CREATE POLICY "Profissionais podem ver sua própria configuração WhatsApp" 
ON public.whatsapp_profissionais 
FOR SELECT 
USING (profissional_id = get_current_profissional_id());

CREATE POLICY "Profissionais podem atualizar sua própria configuração WhatsApp" 
ON public.whatsapp_profissionais 
FOR UPDATE 
USING (profissional_id = get_current_profissional_id());

CREATE POLICY "Profissionais podem inserir sua própria configuração WhatsApp" 
ON public.whatsapp_profissionais 
FOR INSERT 
WITH CHECK (profissional_id = get_current_profissional_id());

CREATE POLICY "Profissionais podem deletar sua própria configuração WhatsApp" 
ON public.whatsapp_profissionais 
FOR DELETE 
USING (profissional_id = get_current_profissional_id());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_whatsapp_profissionais_updated_at
BEFORE UPDATE ON public.whatsapp_profissionais
FOR EACH ROW
EXECUTE FUNCTION public.trigger_atualizado_em();

-- Adicionar campo origem nos agendamentos para rastrear de onde veio
ALTER TABLE public.agendamentos 
ADD COLUMN origem TEXT DEFAULT 'web';