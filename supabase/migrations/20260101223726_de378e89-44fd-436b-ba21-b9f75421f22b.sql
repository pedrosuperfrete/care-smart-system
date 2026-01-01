-- Criar função para atualizar timestamp se não existir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar tabela para mensagens proativas do WhatsApp
CREATE TABLE public.whatsapp_mensagens_proativas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  tipo_mensagem TEXT NOT NULL,
  nome_mensagem TEXT NOT NULL,
  conteudo_mensagem TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  trigger_descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar comentário na tabela
COMMENT ON TABLE public.whatsapp_mensagens_proativas IS 'Configurações de mensagens proativas enviadas via WhatsApp';

-- Índice por profissional
CREATE INDEX idx_whatsapp_mensagens_proativas_profissional ON public.whatsapp_mensagens_proativas(profissional_id);

-- Enable RLS
ALTER TABLE public.whatsapp_mensagens_proativas ENABLE ROW LEVEL SECURITY;

-- Política para visualizar - profissional ou membros da clínica
CREATE POLICY "Profissionais podem ver suas mensagens proativas"
ON public.whatsapp_mensagens_proativas
FOR SELECT
USING (
  profissional_id IN (
    SELECT p.id FROM profissionais p WHERE p.user_id = auth.uid()
  )
  OR
  profissional_id IN (
    SELECT p.id FROM profissionais p
    WHERE p.clinica_id IN (
      SELECT uc.clinica_id FROM get_user_clinicas() uc
    )
  )
);

-- Política para inserir
CREATE POLICY "Profissionais podem criar suas mensagens proativas"
ON public.whatsapp_mensagens_proativas
FOR INSERT
WITH CHECK (
  profissional_id IN (
    SELECT p.id FROM profissionais p WHERE p.user_id = auth.uid()
  )
  OR
  profissional_id IN (
    SELECT p.id FROM profissionais p
    WHERE p.clinica_id IN (
      SELECT uc.clinica_id FROM get_user_clinicas() uc WHERE uc.tipo_papel IN ('admin_clinica', 'recepcionista')
    )
  )
);

-- Política para atualizar
CREATE POLICY "Profissionais podem atualizar suas mensagens proativas"
ON public.whatsapp_mensagens_proativas
FOR UPDATE
USING (
  profissional_id IN (
    SELECT p.id FROM profissionais p WHERE p.user_id = auth.uid()
  )
  OR
  profissional_id IN (
    SELECT p.id FROM profissionais p
    WHERE p.clinica_id IN (
      SELECT uc.clinica_id FROM get_user_clinicas() uc WHERE uc.tipo_papel IN ('admin_clinica', 'recepcionista')
    )
  )
);

-- Política para deletar
CREATE POLICY "Profissionais podem deletar suas mensagens proativas"
ON public.whatsapp_mensagens_proativas
FOR DELETE
USING (
  profissional_id IN (
    SELECT p.id FROM profissionais p WHERE p.user_id = auth.uid()
  )
  OR is_admin()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_whatsapp_mensagens_proativas_updated_at
BEFORE UPDATE ON public.whatsapp_mensagens_proativas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();