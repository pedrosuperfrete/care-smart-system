-- Criar tabela para registro de erros do sistema
CREATE TABLE public.erros_sistema (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES profissionais(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('calendar_sync', 'pagamento', 'sistema')),
  entidade_id UUID, -- ID da entidade relacionada (agendamento_id, pagamento_id, etc)
  mensagem_erro TEXT NOT NULL,
  data_ocorrencia TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolvido BOOLEAN NOT NULL DEFAULT false,
  tentativas_retry INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.erros_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Erros visíveis por profissional responsável ou admin"
ON public.erros_sistema
FOR SELECT
USING (
  is_admin() OR 
  is_recepcionista() OR 
  (profissional_id = get_current_profissional_id()) OR
  (user_id = auth.uid())
);

CREATE POLICY "Profissional ou admin podem atualizar erros"
ON public.erros_sistema
FOR UPDATE
USING (
  is_admin() OR 
  is_recepcionista() OR 
  (profissional_id = get_current_profissional_id()) OR
  (user_id = auth.uid())
);

CREATE POLICY "Sistema pode inserir erros"
ON public.erros_sistema
FOR INSERT
WITH CHECK (true);

-- Trigger para atualizar timestamp
CREATE TRIGGER update_erros_sistema_updated_at
  BEFORE UPDATE ON public.erros_sistema
  FOR EACH ROW
  EXECUTE FUNCTION trigger_atualizado_em();

-- Índices para performance
CREATE INDEX idx_erros_sistema_user_id ON public.erros_sistema(user_id);
CREATE INDEX idx_erros_sistema_profissional_id ON public.erros_sistema(profissional_id);
CREATE INDEX idx_erros_sistema_tipo ON public.erros_sistema(tipo);
CREATE INDEX idx_erros_sistema_resolvido ON public.erros_sistema(resolvido);
CREATE INDEX idx_erros_sistema_entidade_id ON public.erros_sistema(entidade_id);