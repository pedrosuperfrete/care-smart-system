
-- Dropar o trigger que bloqueia exclusão
DROP TRIGGER IF EXISTS validate_user_has_role_trigger ON user_roles;

-- Deletar na ordem correta
DELETE FROM user_roles 
WHERE user_id IN (
  '116cab64-3da7-4392-bd14-a491c629951e',
  '3caf45bf-406e-409f-b88c-4cb047d34f05',
  'b7cad09c-6db2-437e-9a61-1d69a8aee076',
  '023e97e2-5018-44b0-bfdd-fdfbc448597a'
);

DELETE FROM profissionais 
WHERE user_id IN (
  '116cab64-3da7-4392-bd14-a491c629951e',
  '3caf45bf-406e-409f-b88c-4cb047d34f05',
  'b7cad09c-6db2-437e-9a61-1d69a8aee076',
  '023e97e2-5018-44b0-bfdd-fdfbc448597a'
);

DELETE FROM usuarios_clinicas 
WHERE usuario_id IN (
  '116cab64-3da7-4392-bd14-a491c629951e',
  '3caf45bf-406e-409f-b88c-4cb047d34f05',
  'b7cad09c-6db2-437e-9a61-1d69a8aee076',
  '023e97e2-5018-44b0-bfdd-fdfbc448597a'
);

DELETE FROM users 
WHERE id IN (
  '116cab64-3da7-4392-bd14-a491c629951e',
  '3caf45bf-406e-409f-b88c-4cb047d34f05',
  'b7cad09c-6db2-437e-9a61-1d69a8aee076',
  '023e97e2-5018-44b0-bfdd-fdfbc448597a'
);

-- Recriar o trigger de proteção
CREATE TRIGGER validate_user_has_role_trigger
  BEFORE DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION user_must_have_role();
