-- Primeiro, vamos adicionar o status "realizado" no enum de agendamentos
ALTER TYPE status_agendamento ADD VALUE 'realizado';

-- Adicionar coluna para indicar se o paciente está inadimplente
ALTER TABLE pacientes ADD COLUMN inadimplente BOOLEAN DEFAULT FALSE;

-- Criar função para gerar pagamentos automáticos quando agendamento é realizado
CREATE OR REPLACE FUNCTION auto_gerar_pagamento()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status mudou para 'realizado' e não havia pagamento ainda
  IF NEW.status = 'realizado' AND OLD.status != 'realizado' THEN
    -- Criar pagamento automaticamente
    INSERT INTO pagamentos (
      agendamento_id,
      forma_pagamento,
      status,
      valor_pago,
      valor_total,
      data_vencimento,
      parcelado,
      parcelas_totais,
      parcelas_recebidas,
      conciliar_auto
    ) VALUES (
      NEW.id,
      'dinheiro'::forma_pagamento, -- valor padrão
      'pendente'::status_pagamento,
      0,
      COALESCE(NEW.valor, 0),
      NOW() + INTERVAL '30 days', -- vencimento em 30 dias
      FALSE,
      1,
      0,
      TRUE
    );
    
    -- Marcar paciente como inadimplente se não houver pagamento
    UPDATE pacientes 
    SET inadimplente = TRUE 
    WHERE id = NEW.paciente_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar a função
CREATE TRIGGER trigger_auto_gerar_pagamento
  AFTER UPDATE ON agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION auto_gerar_pagamento();

-- Criar função para atualizar status de inadimplência do paciente
CREATE OR REPLACE FUNCTION atualizar_inadimplencia_paciente()
RETURNS TRIGGER AS $$
DECLARE
  paciente_id_pagamento UUID;
BEGIN
  -- Buscar o paciente do agendamento relacionado ao pagamento
  SELECT a.paciente_id INTO paciente_id_pagamento
  FROM agendamentos a 
  WHERE a.id = COALESCE(NEW.agendamento_id, OLD.agendamento_id);

  -- Se o pagamento foi marcado como pago, verificar se paciente ainda tem pendências
  IF TG_OP = 'UPDATE' AND NEW.status = 'pago' AND OLD.status != 'pago' THEN
    -- Verificar se ainda há pagamentos pendentes para o paciente
    IF NOT EXISTS (
      SELECT 1 FROM pagamentos p
      JOIN agendamentos a ON p.agendamento_id = a.id
      WHERE a.paciente_id = paciente_id_pagamento 
      AND p.status IN ('pendente', 'vencido')
    ) THEN
      -- Se não há mais pendências, remover status de inadimplente
      UPDATE pacientes 
      SET inadimplente = FALSE 
      WHERE id = paciente_id_pagamento;
    END IF;
  END IF;

  -- Se um pagamento foi criado ou marcado como pendente/vencido, marcar como inadimplente
  IF (TG_OP = 'INSERT' AND NEW.status IN ('pendente', 'vencido')) OR 
     (TG_OP = 'UPDATE' AND NEW.status IN ('pendente', 'vencido')) THEN
    UPDATE pacientes 
    SET inadimplente = TRUE 
    WHERE id = paciente_id_pagamento;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar inadimplência
CREATE TRIGGER trigger_atualizar_inadimplencia
  AFTER INSERT OR UPDATE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_inadimplencia_paciente();