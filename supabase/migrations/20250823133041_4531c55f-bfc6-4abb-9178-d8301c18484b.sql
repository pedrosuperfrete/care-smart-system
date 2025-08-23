-- Corrigir as últimas 3 funções para ter search_path seguro

-- Função 14: atualizar_inadimplencia_paciente
CREATE OR REPLACE FUNCTION public.atualizar_inadimplencia_paciente()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
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
$function$;

-- Função 15: trigger_atualizado_em
CREATE OR REPLACE FUNCTION public.trigger_atualizado_em()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$function$;

-- Função 16: trigger_ultima_edicao
CREATE OR REPLACE FUNCTION public.trigger_ultima_edicao()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.ultima_edicao = now();
    RETURN NEW;
END;
$function$;