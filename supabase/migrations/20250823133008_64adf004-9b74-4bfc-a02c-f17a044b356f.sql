-- Corrigir as últimas funções para ter search_path seguro

-- Função 11: normalizar_telefone
CREATE OR REPLACE FUNCTION public.normalizar_telefone(telefone text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = public
AS $function$
BEGIN
  -- Remove espaços, parênteses, hífens, plus e pontos
  -- Mantém apenas dígitos
  RETURN regexp_replace(telefone, '[^0-9]', '', 'g');
END;
$function$;

-- Função 12: associar_paciente_whatsapp
CREATE OR REPLACE FUNCTION public.associar_paciente_whatsapp()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  paciente_encontrado_id UUID;
  numero_normalizado TEXT;
  telefone_paciente_normalizado TEXT;
BEGIN
  -- Normalizar o número da mensagem
  numero_normalizado := normalizar_telefone(NEW.numero_paciente);
  
  -- Se o número normalizado tem menos de 8 dígitos, não tenta buscar
  IF length(numero_normalizado) < 8 THEN
    RETURN NEW;
  END IF;
  
  -- Buscar paciente que tenha telefone que termine com o número normalizado
  -- Considera os últimos 8-11 dígitos para ser mais flexível
  SELECT p.id INTO paciente_encontrado_id
  FROM pacientes p
  WHERE p.telefone IS NOT NULL 
    AND normalizar_telefone(p.telefone) LIKE '%' || right(numero_normalizado, 8)
    AND p.ativo = true
  LIMIT 1;
  
  -- Se não encontrou com 8 dígitos, tenta com 9 (celular com 9º dígito)
  IF paciente_encontrado_id IS NULL AND length(numero_normalizado) >= 9 THEN
    SELECT p.id INTO paciente_encontrado_id
    FROM pacientes p
    WHERE p.telefone IS NOT NULL 
      AND normalizar_telefone(p.telefone) LIKE '%' || right(numero_normalizado, 9)
      AND p.ativo = true
    LIMIT 1;
  END IF;
  
  -- Se encontrou paciente, associa à mensagem
  IF paciente_encontrado_id IS NOT NULL THEN
    NEW.paciente_id := paciente_encontrado_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Função 13: auto_gerar_pagamento
CREATE OR REPLACE FUNCTION public.auto_gerar_pagamento()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  -- Se o status mudou para 'realizado' e não havia pagamento ainda
  IF NEW.status = 'realizado' AND (OLD.status IS NULL OR OLD.status != 'realizado') THEN
    -- Verificar se já existe um pagamento para este agendamento
    IF NOT EXISTS (SELECT 1 FROM pagamentos WHERE agendamento_id = NEW.id) THEN
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
      
      -- Marcar paciente como inadimplente
      UPDATE pacientes 
      SET inadimplente = TRUE 
      WHERE id = NEW.paciente_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;