CREATE OR REPLACE FUNCTION public.auto_gerar_pagamento()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_percentual_agendamento numeric;
  v_percentual_falta numeric;
  v_valor_cobranca numeric;
  v_valor_total numeric;
  v_tipo_servico_record record;
  v_profissional_clinica_id uuid;
  v_servico_adicional jsonb;
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

  -- Calcular valor total (serviço principal + serviços adicionais)
  v_valor_total := COALESCE(NEW.valor, 0);
  
  -- Somar valores dos serviços adicionais se existirem
  IF NEW.servicos_adicionais IS NOT NULL AND jsonb_typeof(NEW.servicos_adicionais) = 'array' THEN
    FOR v_servico_adicional IN SELECT * FROM jsonb_array_elements(NEW.servicos_adicionais)
    LOOP
      v_valor_total := v_valor_total + COALESCE((v_servico_adicional->>'valor')::numeric, 0);
    END LOOP;
  END IF;

  -- CASO 0: Recalcular pagamento pendente se valor ou servicos_adicionais mudarem
  IF OLD IS NOT NULL AND (
    COALESCE(OLD.valor, 0) != COALESCE(NEW.valor, 0) OR
    COALESCE(OLD.servicos_adicionais::text, '[]') != COALESCE(NEW.servicos_adicionais::text, '[]')
  ) THEN
    -- Atualizar pagamento pendente existente com novo valor total
    UPDATE pagamentos 
    SET valor_total = v_valor_total
    WHERE agendamento_id = NEW.id 
      AND status = 'pendente';
  END IF;

  -- CASO 1: Status mudou para 'confirmado' e tem cobrança por agendamento
  IF NEW.status = 'confirmado' AND (OLD.status IS NULL OR OLD.status != 'confirmado') THEN
    IF v_percentual_agendamento > 0 THEN
      -- Calcular valor da cobrança (percentual do valor total)
      v_valor_cobranca := (v_valor_total * v_percentual_agendamento) / 100;
      
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
          NOW() + INTERVAL '3 days',
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
      -- Calcular valor da cobrança por falta (usando valor total)
      v_valor_cobranca := (v_valor_total * v_percentual_falta) / 100;
      
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
    -- Verificar se já existe pagamento
    IF EXISTS (SELECT 1 FROM pagamentos WHERE agendamento_id = NEW.id) THEN
      -- Atualizar pagamento existente com valor total
      UPDATE pagamentos 
      SET valor_total = v_valor_total
      WHERE agendamento_id = NEW.id AND status = 'pendente';
    ELSE
      -- Criar novo pagamento para o valor total do serviço
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
        v_valor_total,
        NOW() + INTERVAL '7 days',
        FALSE,
        1,
        0,
        TRUE
      );
      
      -- Marcar paciente como inadimplente até pagar
      UPDATE pacientes 
      SET inadimplente = TRUE 
      WHERE id = NEW.paciente_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;