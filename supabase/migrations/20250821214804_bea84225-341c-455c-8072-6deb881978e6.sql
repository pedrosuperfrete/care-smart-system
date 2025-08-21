-- Corrigir inconsistência da Livia Rigueiral
-- Atualizar o clinica_id na tabela profissionais para coincidir com usuarios_clinicas

UPDATE profissionais 
SET clinica_id = '52f72d36-cbed-4402-89e2-bf22c6718cfa'
WHERE user_id = '3caf45bf-406e-409f-b88c-4cb047d34f05' 
  AND id = 'dca4bba6-3b12-49b8-af4d-0df13a90b98a';