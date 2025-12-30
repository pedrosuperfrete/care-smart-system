-- Atualizar função de auto geração de pagamento para considerar cobranças por confirmação e falta
CREATE OR REPLACE FUNCTION public.auto_gerar_pagamento()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_percentual_agendamento numeric;
  v_percentual_falta numeric;
  v_valor_cobranca numeric;
  v_tipo_servico_record record;
  v_profissional_clinica_id uuid;
BEGIN
  -- Buscar clínica do profissional para filtrar tipo de serviço corretamente
  SELECT clinica_id INTO v_profissional_clinica_id
  FROM profissionais
  WHERE id = NEW.profissional_id;

  -- Buscar percentuais do tipo de serviço
  SELECT 
    ts.percentual_cobranca_agendamento,
    ts.percentual_cobranca_falta,
    ts.preco
  INTO v_tipo_servico_record
  FROM tipos_servicos ts
  WHERE ts.nome = NEW.tipo_servico
    AND ts.ativo = true
    AND (ts.clinica_id = v_profissional_clinica_id OR ts.profissional_id = NEW.profissional_id)
  LIMIT 1;

  v_percentual_agendamento := COALESCE(v_tipo_servico_record.percentual_cobranca_agendamento, 0);
  v_percentual_falta := COALESCE(v_tipo_servico_record.percentual_cobranca_falta, 0);

  -- CASO 1: Status mudou para 'confirmado' e tem cobrança por agendamento
  IF NEW.status = 'confirmado' AND (OLD.status IS NULL OR OLD.status != 'confirmado') THEN
    IF v_percentual_agendamento > 0 THEN
      -- Calcular valor da cobrança (percentual do valor do serviço)
      v_valor_cobranca := (COALESCE(NEW.valor, 0) * v_percentual_agendamento) / 100;
      
      -- Verificar se já existe um pagamento para este agendamento
      IF NOT EXISTS (SELECT 1 FROM pagamentos WHERE agendamento_id = NEW.id) THEN
        -- Criar pagamento para a taxa de agendamento
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
          'pix'::forma_pagamento,
          'pendente'::status_pagamento,
          0,
          v_valor_cobranca,
          NOW() + INTERVAL '3 days', -- vencimento em 3 dias para taxa de agendamento
          FALSE,
          1,
          0,
          TRUE
        );
        
        -- Marcar paciente como inadimplente
        UPDATE pacientes 
        SET inadimplente = TRUE 
        WHERE id = NEW.paciente_id;
      END IF;
    END IF;
  END IF;

  -- CASO 2: Status mudou para 'falta' e tem cobrança por falta
  IF NEW.status = 'falta' AND (OLD.status IS NULL OR OLD.status != 'falta') THEN
    IF v_percentual_falta > 0 THEN
      -- Calcular valor da cobrança por falta
      v_valor_cobranca := (COALESCE(NEW.valor, 0) * v_percentual_falta) / 100;
      
      -- Verificar se já existe pagamento
      IF EXISTS (SELECT 1 FROM pagamentos WHERE agendamento_id = NEW.id) THEN
        -- Atualizar pagamento existente com valor da falta
        UPDATE pagamentos 
        SET valor_total = v_valor_cobranca,
            data_vencimento = NOW() + INTERVAL '7 days'
        WHERE agendamento_id = NEW.id AND status = 'pendente';
      ELSE
        -- Criar novo pagamento para a multa de falta
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
          'pix'::forma_pagamento,
          'pendente'::status_pagamento,
          0,
          v_valor_cobranca,
          NOW() + INTERVAL '7 days',
          FALSE,
          1,
          0,
          TRUE
        );
      END IF;
      
      -- Marcar paciente como inadimplente
      UPDATE pacientes 
      SET inadimplente = TRUE 
      WHERE id = NEW.paciente_id;
    END IF;
  END IF;

  -- CASO 3: Status mudou para 'realizado'
  IF NEW.status = 'realizado' AND (OLD.status IS NULL OR OLD.status != 'realizado') THEN
    -- Verificar se já existe um pagamento para este agendamento
    IF EXISTS (SELECT 1 FROM pagamentos WHERE agendamento_id = NEW.id) THEN
      -- Atualizar pagamento existente com valor total do serviço
      UPDATE pagamentos 
      SET valor_total = COALESCE(NEW.valor, 0),
          data_vencimento = NOW() + INTERVAL '30 days'
      WHERE agendamento_id = NEW.id AND status = 'pendente';
    ELSE
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
        'dinheiro'::forma_pagamento,
        'pendente'::status_pagamento,
        0,
        COALESCE(NEW.valor, 0),
        NOW() + INTERVAL '30 days',
        FALSE,
        1,
        0,
        TRUE
      );
    END IF;
    
    -- Marcar paciente como inadimplente
    UPDATE pacientes 
    SET inadimplente = TRUE 
    WHERE id = NEW.paciente_id;
  END IF;

  RETURN NEW;
END;
$function$;