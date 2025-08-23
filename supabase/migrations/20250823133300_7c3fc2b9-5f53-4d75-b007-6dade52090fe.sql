-- Corrigir usuários órfãos (versão final)

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
  
  -- Associar usuários sem clínica à clínica padrão
  FOR usuario_sem_clinica IN 
    SELECT u.id, u.email, u.tipo_usuario
    FROM users u
    LEFT JOIN usuarios_clinicas uc ON u.id = uc.usuario_id AND uc.ativo = true
    WHERE uc.id IS NULL AND u.ativo = true
  LOOP
    -- Inserir associação de clínica
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
      -- Verificar se já existe antes de inserir
      IF NOT EXISTS (SELECT 1 FROM profissionais WHERE user_id = usuario_sem_clinica.id) THEN
        INSERT INTO profissionais (user_id, clinica_id, nome, especialidade, crm_cro)
        VALUES (
          usuario_sem_clinica.id,
          clinica_padrao_id,
          COALESCE(SPLIT_PART(usuario_sem_clinica.email, '@', 1), 'Profissional'),
          'Geral',
          'TEMP123'
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- Atualizar profissionais com nome em branco
UPDATE profissionais 
SET nome = COALESCE(SPLIT_PART((SELECT email FROM users WHERE id = user_id), '@', 1), 'Profissional')
WHERE (nome IS NULL OR nome = '' OR LENGTH(TRIM(nome)) = 0);