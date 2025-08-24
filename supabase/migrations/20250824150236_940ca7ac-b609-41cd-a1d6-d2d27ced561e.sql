-- Corrigir associação das recepcionistas para a clínica correta do profissional
WITH clinica_real AS (
  SELECT p.clinica_id
  FROM profissionais p 
  WHERE p.ativo = true 
  AND p.assinatura_ativa = true
  AND p.nome = 'Pedro 24/08'
  LIMIT 1
),
usuarios_recepcionistas AS (
  SELECT u.id as user_id
  FROM users u 
  WHERE u.email IN ('recepcionista2@teste.com', 'recepcionista3@teste.com')
)
-- Atualizar todas as recepcionistas para a clínica correta
UPDATE usuarios_clinicas 
SET clinica_id = (SELECT clinica_id FROM clinica_real)
WHERE usuario_id IN (SELECT user_id FROM usuarios_recepcionistas)
AND tipo_papel = 'recepcionista';