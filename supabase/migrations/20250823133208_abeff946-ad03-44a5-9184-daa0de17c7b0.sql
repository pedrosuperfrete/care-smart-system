-- Corrigir usuários órfãos e problemas de estrutura (versão corrigida)

DO $$
DECLARE
  clinica_padrao_id UUID;
  usuario_sem_clinica RECORD;
BEGIN
  -- Buscar uma clínica existente para usar como padrão
  SELECT id INTO clinica_padrao_id 
  FROM clinicas 
  ORDER BY criado_em ASC 
  LIMIT 1;
  
  -- Se não há clínica, criar uma temporária
  IF clinica_padrao_id IS NULL THEN
    INSERT INTO clinicas (nome, cnpj) 
    VALUES ('Clínica Temporária', '00000000000100')
    RETURNING id INTO clinica_padrao_id;
  END IF;
  
  -- Associar usuários sem clínica à clínica padrão
  FOR usuario_sem_clinica IN 
    SELECT u.id, u.email, u.tipo_usuario
    FROM users u
    LEFT JOIN usuarios_clinicas uc ON u.id = uc.usuario_id AND uc.ativo = true
    WHERE uc.id IS NULL AND u.ativo = true
  LOOP
    INSERT INTO usuarios_clinicas (usuario_id, clinica_id, tipo_papel)
    VALUES (
      usuario_sem_clinica.id, 
      clinica_padrao_id,
      CASE 
        WHEN usuario_sem_clinica.tipo_usuario = 'admin' THEN 'admin_clinica'
        WHEN usuario_sem_clinica.tipo_usuario = 'recepcionista' THEN 'recepcionista'  
        WHEN usuario_sem_clinica.tipo_usuario = 'profissional' THEN 'profissional'
        ELSE 'profissional'
      END
    );
    
    -- Se é profissional, criar registro na tabela profissionais se não existir
    IF usuario_sem_clinica.tipo_usuario = 'profissional' THEN
      INSERT INTO profissionais (user_id, clinica_id, nome, especialidade, crm_cro)
      VALUES (
        usuario_sem_clinica.id,
        clinica_padrao_id,
        COALESCE(SPLIT_PART(usuario_sem_clinica.email, '@', 1), 'Profissional'),
        'Geral',
        'TEMP123'
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Atualizar profissionais com nome em branco
UPDATE profissionais 
SET nome = COALESCE(SPLIT_PART((SELECT email FROM users WHERE id = user_id), '@', 1), 'Profissional')
WHERE (nome IS NULL OR nome = '' OR nome = ' ');