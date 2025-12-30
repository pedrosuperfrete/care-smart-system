-- Criar pagamentos para agendamentos realizados que ainda não têm pagamento
INSERT INTO pagamentos (agendamento_id, forma_pagamento, status, valor_pago, valor_total, data_vencimento, parcelado, parcelas_totais, parcelas_recebidas, conciliar_auto)
SELECT 
  a.id,
  'pix'::forma_pagamento,
  'pendente'::status_pagamento,
  0,
  COALESCE(a.valor, 0) + COALESCE(
    (SELECT SUM(COALESCE((elem->>'valor')::numeric, 0))
     FROM jsonb_array_elements(a.servicos_adicionais) AS elem),
    0
  ),
  NOW() + INTERVAL '7 days',
  FALSE,
  1,
  0,
  TRUE
FROM agendamentos a
WHERE a.status = 'realizado'
  AND NOT EXISTS (SELECT 1 FROM pagamentos p WHERE p.agendamento_id = a.id);