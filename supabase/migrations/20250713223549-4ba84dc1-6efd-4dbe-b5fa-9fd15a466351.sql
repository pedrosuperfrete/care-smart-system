-- Corrigir problema de isolamento de dados
-- Verificar se o usuário que criou a "Clinica do Pedro" está na clínica correta

-- Primeiro, verificar qual usuário criou qual clínica e corrigir as associações
UPDATE usuarios_clinicas 
SET clinica_id = '6cdc4211-fa47-4af8-87b8-c3e1abfbd0e0',
    tipo_papel = 'admin_clinica'
WHERE usuario_id = '60ccdd96-5348-4a21-81fa-7981e906384a';

-- Atualizar também o profissional para a clínica correta
UPDATE profissionais 
SET clinica_id = '6cdc4211-fa47-4af8-87b8-c3e1abfbd0e0'
WHERE user_id = '60ccdd96-5348-4a21-81fa-7981e906384a';