
-- Limpar todos os dados das tabelas para teste completo do zero
DELETE FROM logs_acesso;
DELETE FROM notas_fiscais;
DELETE FROM documentos;
DELETE FROM prontuarios;
DELETE FROM pagamentos;
DELETE FROM agendamentos;
DELETE FROM pacientes;
DELETE FROM profissionais;
DELETE FROM users;
DELETE FROM modelos_documentos;
DELETE FROM modelos_prontuarios;

-- Limpar também dados de autenticação se necessário
-- (isso será feito automaticamente quando os usuários forem deletados)
