-- Corrigir vinculação da Livia Rigueiral à clínica correta
-- Ela deve estar na clínica "Dra Livia" conforme registrada na tabela profissionais

-- Primeiro, reverter a mudança anterior na tabela profissionais
UPDATE profissionais 
SET clinica_id = '20dcd309-52d1-499b-b734-a3d5141ffdc4'
WHERE user_id = '3caf45bf-406e-409f-b88c-4cb047d34f05' 
  AND id = 'dca4bba6-3b12-49b8-af4d-0df13a90b98a';

-- Agora atualizar a tabela usuarios_clinicas para coincidir com a clínica correta
UPDATE usuarios_clinicas 
SET clinica_id = '20dcd309-52d1-499b-b734-a3d5141ffdc4'
WHERE usuario_id = '3caf45bf-406e-409f-b88c-4cb047d34f05' 
  AND id = 'b63b5ba7-fcb4-49ad-b5fc-cb3a7db05a68';