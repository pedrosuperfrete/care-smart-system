-- Atualizar pagamentos pendentes existentes com o valor correto (serviço principal + adicionais)
UPDATE pagamentos p
SET valor_total = (
  SELECT 
    COALESCE(a.valor, 0) + 
    COALESCE(
      (SELECT SUM(COALESCE((elem->>'valor')::numeric, 0))
       FROM jsonb_array_elements(a.servicos_adicionais) AS elem),
      0
    )
  FROM agendamentos a
  WHERE a.id = p.agendamento_id
)
WHERE p.status = 'pendente'
  AND EXISTS (
    SELECT 1 FROM agendamentos a 
    WHERE a.id = p.agendamento_id 
    AND jsonb_typeof(a.servicos_adicionais) = 'array'
    AND jsonb_array_length(a.servicos_adicionais) > 0
  );