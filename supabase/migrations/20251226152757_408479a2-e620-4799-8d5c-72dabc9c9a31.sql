-- Limpar dados relacionados e pacientes (em ordem para respeitar FKs)

-- 1. Deletar notas fiscais
DELETE FROM notas_fiscais;

-- 2. Deletar pagamentos
DELETE FROM pagamentos;

-- 3. Deletar prontuários
DELETE FROM prontuarios;

-- 4. Deletar agendamentos
DELETE FROM agendamentos;

-- 5. Deletar mensagens WhatsApp
DELETE FROM whatsapp_mensagens;

-- 6. Deletar documentos
DELETE FROM documentos;

-- 7. Finalmente, deletar pacientes
DELETE FROM pacientes;