-- Criar uma clínica padrão para novos profissionais
INSERT INTO clinicas (nome, cnpj, endereco) 
VALUES ('Clínica Padrão', '00.000.000/0000-00', 'Endereço a ser definido')
ON CONFLICT DO NOTHING;

-- Criar função para garantir que profissionais sempre tenham uma clínica
CREATE OR REPLACE FUNCTION create_default_profissional()
RETURNS TRIGGER AS $$
DECLARE
  default_clinica_id UUID;
BEGIN
  -- Se for um profissional, criar registro na tabela profissionais
  IF NEW.tipo_usuario = 'profissional' THEN
    -- Buscar clínica padrão
    SELECT id INTO default_clinica_id FROM clinicas LIMIT 1;
    
    -- Se não existir clínica, criar uma
    IF default_clinica_id IS NULL THEN
      INSERT INTO clinicas (nome, cnpj, endereco) 
      VALUES ('Clínica Padrão', '00.000.000/0000-00', 'Endereço a ser definido')
      RETURNING id INTO default_clinica_id;
    END IF;
    
    -- Criar registro do profissional
    INSERT INTO profissionais (
      user_id, 
      clinica_id, 
      nome, 
      especialidade, 
      crm_cro, 
      onboarding_completo
    ) VALUES (
      NEW.id, 
      default_clinica_id, 
      '', 
      '', 
      '', 
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar quando usuário for inserido
DROP TRIGGER IF EXISTS trigger_create_profissional ON users;
CREATE TRIGGER trigger_create_profissional
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_profissional();