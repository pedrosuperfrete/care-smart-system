-- Limpar registros duplicados de profissionais
-- Manter apenas o registro mais antigo (primeiro criado) para cada user_id
DELETE FROM profissionais 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id 
    FROM profissionais 
    ORDER BY user_id, criado_em ASC
);

-- Garantir que não haverá mais duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_profissionais_user_id_unique 
ON profissionais (user_id) 
WHERE ativo = true;