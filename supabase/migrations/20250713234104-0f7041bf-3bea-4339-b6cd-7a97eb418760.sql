-- Corrigir a inconsistência de dados: atualizar o profissional para estar na mesma clínica do usuário
UPDATE profissionais 
SET clinica_id = (
  SELECT uc.clinica_id 
  FROM usuarios_clinicas uc 
  WHERE uc.usuario_id = profissionais.user_id 
  AND uc.ativo = true 
  LIMIT 1
)
WHERE user_id = '60ccdd96-5348-4a21-81fa-7981e906384a';