-- Primeiro, mover o profissional Pedro 24/08 para a clínica correta
UPDATE profissionais 
SET clinica_id = '6cdc4211-fa47-4af8-87b8-c3e1abfbd0e0'
WHERE nome = 'Pedro 24/08' 
AND user_id = '17a414c0-1e40-44c5-b6a5-5e2f20dc456e';

-- Depois, mover o usuário profissional para a clínica correta
UPDATE usuarios_clinicas 
SET clinica_id = '6cdc4211-fa47-4af8-87b8-c3e1abfbd0e0'
WHERE usuario_id = '17a414c0-1e40-44c5-b6a5-5e2f20dc456e'
AND tipo_papel = 'profissional';

-- Por fim, mover todas as recepcionistas para a clínica correta
UPDATE usuarios_clinicas 
SET clinica_id = '6cdc4211-fa47-4af8-87b8-c3e1abfbd0e0'
WHERE usuario_id IN (
  SELECT u.id 
  FROM users u 
  WHERE u.email IN ('recepcionista2@teste.com', 'recepcionista3@teste.com')
)
AND tipo_papel = 'recepcionista';