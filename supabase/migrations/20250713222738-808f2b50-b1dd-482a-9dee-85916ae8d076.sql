-- Corrigir usuários que não têm associação com clínicas
-- Primeiro, verificar usuários sem associação
DO $$
DECLARE
    user_record RECORD;
    default_clinica_id UUID;
BEGIN
    -- Buscar clínica padrão
    SELECT id INTO default_clinica_id FROM clinicas LIMIT 1;
    
    -- Para cada usuário que não tem associação, criar uma
    FOR user_record IN 
        SELECT u.id, u.tipo_usuario 
        FROM users u 
        LEFT JOIN usuarios_clinicas uc ON u.id = uc.usuario_id 
        WHERE uc.usuario_id IS NULL
    LOOP
        -- Criar associação com a clínica padrão
        INSERT INTO usuarios_clinicas (usuario_id, clinica_id, tipo_papel)
        VALUES (
            user_record.id, 
            default_clinica_id, 
            CASE 
                WHEN user_record.tipo_usuario = 'admin' THEN 'admin_clinica'
                WHEN user_record.tipo_usuario = 'profissional' THEN 'profissional'
                ELSE 'recepcionista'
            END
        );
        
        -- Se for profissional e não existe registro na tabela profissionais, criar
        IF user_record.tipo_usuario = 'profissional' THEN
            INSERT INTO profissionais (user_id, clinica_id, nome, especialidade, crm_cro, onboarding_completo)
            SELECT user_record.id, default_clinica_id, '', '', '', false
            WHERE NOT EXISTS (
                SELECT 1 FROM profissionais WHERE user_id = user_record.id
            );
        END IF;
    END LOOP;
END $$;