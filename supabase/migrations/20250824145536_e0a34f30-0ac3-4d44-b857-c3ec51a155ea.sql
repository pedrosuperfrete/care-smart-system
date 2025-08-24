-- Encontrar a clínica real do profissional ativo
WITH clinica_real AS (
  SELECT p.clinica_id
  FROM profissionais p 
  WHERE p.ativo = true 
  AND p.assinatura_ativa = true
  LIMIT 1
),
recepcionista_user AS (
  SELECT u.id as user_id
  FROM users u 
  WHERE u.email LIKE '%recepcionista2%' 
  OR u.email = 'recepcionista2@exemplo.com'
  LIMIT 1
)
-- Atualizar a associação da recepcionista2 para a clínica correta
UPDATE usuarios_clinicas 
SET clinica_id = (SELECT clinica_id FROM clinica_real)
WHERE usuario_id = (SELECT user_id FROM recepcionista_user)
AND tipo_papel = 'recepcionista';