
-- Limpar todos os dados das tabelas para teste do zero
DELETE FROM logs_acesso;
DELETE FROM notas_fiscais;
DELETE FROM documentos;
DELETE FROM prontuarios;
DELETE FROM pagamentos;
DELETE FROM agendamentos;
DELETE FROM pacientes;
DELETE FROM profissionais;
DELETE FROM users WHERE email != 'admin@system.com'; -- Manter apenas um admin se existir
DELETE FROM modelos_documentos;
DELETE FROM modelos_prontuarios;

-- Reset das sequences se necessário
-- As UUIDs são geradas automaticamente, então não precisamos resetar sequences
