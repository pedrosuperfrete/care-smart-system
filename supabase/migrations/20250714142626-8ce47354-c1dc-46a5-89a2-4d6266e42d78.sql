-- Criar tabela para armazenar mensagens do WhatsApp
CREATE TABLE public.whatsapp_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  numero_paciente TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('recebida', 'enviada')) NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'processada', 'erro')),
  origem_integracao TEXT, -- Ex: evolution-api
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT now(),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_mensagens
CREATE POLICY "Profissionais podem ver suas próprias mensagens WhatsApp" 
ON public.whatsapp_mensagens 
FOR SELECT 
USING (profissional_id = get_current_profissional_id());

CREATE POLICY "Profissionais podem inserir suas próprias mensagens WhatsApp" 
ON public.whatsapp_mensagens 
FOR INSERT 
WITH CHECK (profissional_id = get_current_profissional_id());

CREATE POLICY "Profissionais podem atualizar suas próprias mensagens WhatsApp" 
ON public.whatsapp_mensagens 
FOR UPDATE 
USING (profissional_id = get_current_profissional_id());

CREATE POLICY "Admin pode ver todas as mensagens WhatsApp" 
ON public.whatsapp_mensagens 
FOR ALL 
USING (is_admin());

-- Função para normalizar números de telefone
CREATE OR REPLACE FUNCTION public.normalizar_telefone(telefone TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove espaços, parênteses, hífens, plus e pontos
  -- Mantém apenas dígitos
  RETURN regexp_replace(telefone, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para associar mensagem ao paciente correto baseado no telefone
CREATE OR REPLACE FUNCTION public.associar_paciente_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
  paciente_encontrado_id UUID;
  numero_normalizado TEXT;
  telefone_paciente_normalizado TEXT;
BEGIN
  -- Normalizar o número da mensagem
  numero_normalizado := public.normalizar_telefone(NEW.numero_paciente);
  
  -- Se o número normalizado tem menos de 8 dígitos, não tenta buscar
  IF length(numero_normalizado) < 8 THEN
    RETURN NEW;
  END IF;
  
  -- Buscar paciente que tenha telefone que termine com o número normalizado
  -- Considera os últimos 8-11 dígitos para ser mais flexível
  SELECT p.id INTO paciente_encontrado_id
  FROM pacientes p
  WHERE p.telefone IS NOT NULL 
    AND public.normalizar_telefone(p.telefone) LIKE '%' || right(numero_normalizado, 8)
    AND p.ativo = true
  LIMIT 1;
  
  -- Se não encontrou com 8 dígitos, tenta com 9 (celular com 9º dígito)
  IF paciente_encontrado_id IS NULL AND length(numero_normalizado) >= 9 THEN
    SELECT p.id INTO paciente_encontrado_id
    FROM pacientes p
    WHERE p.telefone IS NOT NULL 
      AND public.normalizar_telefone(p.telefone) LIKE '%' || right(numero_normalizado, 9)
      AND p.ativo = true
    LIMIT 1;
  END IF;
  
  -- Se encontrou paciente, associa à mensagem
  IF paciente_encontrado_id IS NOT NULL THEN
    NEW.paciente_id := paciente_encontrado_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar a função automaticamente ao inserir mensagens
CREATE TRIGGER trigger_associar_paciente_whatsapp
  BEFORE INSERT ON public.whatsapp_mensagens
  FOR EACH ROW
  EXECUTE FUNCTION public.associar_paciente_whatsapp();

-- Trigger para atualizar atualizado_em
CREATE TRIGGER update_whatsapp_mensagens_updated_at
  BEFORE UPDATE ON public.whatsapp_mensagens
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_atualizado_em();

-- Criar índices para melhor performance
CREATE INDEX idx_whatsapp_mensagens_profissional_id ON public.whatsapp_mensagens(profissional_id);
CREATE INDEX idx_whatsapp_mensagens_paciente_id ON public.whatsapp_mensagens(paciente_id);
CREATE INDEX idx_whatsapp_mensagens_numero_paciente ON public.whatsapp_mensagens(numero_paciente);
CREATE INDEX idx_whatsapp_mensagens_data_hora ON public.whatsapp_mensagens(data_hora DESC);