
-- Criar enums para campos com opções fixas
CREATE TYPE tipo_usuario AS ENUM ('admin', 'profissional', 'recepcionista');
CREATE TYPE risco_paciente AS ENUM ('baixo', 'medio', 'alto');
CREATE TYPE status_agendamento AS ENUM ('pendente', 'confirmado', 'realizado', 'faltou');
CREATE TYPE forma_pagamento AS ENUM ('pix', 'cartao', 'dinheiro', 'link');
CREATE TYPE status_pagamento AS ENUM ('pendente', 'pago', 'vencido', 'estornado');
CREATE TYPE status_emissao_nf AS ENUM ('emitida', 'pendente', 'erro');

-- Tabela de usuários
CREATE TABLE users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    tipo_usuario tipo_usuario NOT NULL DEFAULT 'recepcionista',
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de clínicas
CREATE TABLE clinicas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    cnpj TEXT UNIQUE NOT NULL,
    endereco TEXT,
    pix_chave TEXT,
    conta_bancaria TEXT,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de profissionais
CREATE TABLE profissionais (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    especialidade TEXT NOT NULL,
    crm_cro TEXT NOT NULL,
    telefone TEXT,
    assinatura_digital TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de pacientes
CREATE TABLE pacientes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL,
    data_nascimento DATE,
    email TEXT,
    telefone TEXT,
    endereco TEXT,
    observacoes TEXT,
    risco risco_paciente DEFAULT 'baixo',
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de modelos de prontuários
CREATE TABLE modelos_prontuarios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    campos_json JSONB,
    especialidade TEXT,
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de modelos de documentos
CREATE TABLE modelos_documentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    conteudo_html TEXT NOT NULL,
    cabecalho_clinica TEXT,
    clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE agendamentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
    profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE NOT NULL,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo_servico TEXT NOT NULL,
    status status_agendamento DEFAULT 'pendente',
    valor NUMERIC(10,2),
    observacoes TEXT,
    confirmado_pelo_paciente BOOLEAN DEFAULT false,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de pagamentos
CREATE TABLE pagamentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agendamento_id UUID REFERENCES agendamentos(id) ON DELETE CASCADE NOT NULL,
    forma_pagamento forma_pagamento NOT NULL,
    status status_pagamento DEFAULT 'pendente',
    valor_pago NUMERIC(10,2) NOT NULL,
    valor_total NUMERIC(10,2) NOT NULL,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    data_vencimento TIMESTAMP WITH TIME ZONE,
    parcelado BOOLEAN DEFAULT false,
    parcelas_totais INTEGER DEFAULT 1,
    parcelas_recebidas INTEGER DEFAULT 0,
    conciliar_auto BOOLEAN DEFAULT true,
    link_pagamento TEXT,
    gateway_id TEXT,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de prontuários
CREATE TABLE prontuarios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
    profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE NOT NULL,
    agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
    template_id UUID REFERENCES modelos_prontuarios(id) ON DELETE SET NULL,
    conteudo TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ultima_edicao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    editado_por UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de documentos
CREATE TABLE documentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
    profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    nome_arquivo TEXT NOT NULL,
    arquivo_url TEXT NOT NULL,
    modelo_id UUID REFERENCES modelos_documentos(id) ON DELETE SET NULL,
    assinado_digital BOOLEAN DEFAULT false,
    status_assinatura TEXT,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de notas fiscais
CREATE TABLE notas_fiscais (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
    pagamento_id UUID REFERENCES pagamentos(id) ON DELETE CASCADE NOT NULL,
    status_emissao status_emissao_nf DEFAULT 'pendente',
    link_nf TEXT,
    numero_nf TEXT,
    valor_nf NUMERIC(10,2),
    data_emissao TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de logs de acesso
CREATE TABLE logs_acesso (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    acao TEXT NOT NULL,
    modulo TEXT NOT NULL,
    detalhes TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar referência de pagamento ao agendamento (após criar tabela de pagamentos)
ALTER TABLE agendamentos ADD COLUMN pagamento_id UUID REFERENCES pagamentos(id) ON DELETE SET NULL;

-- Criar índices para otimizar consultas frequentes
CREATE INDEX idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX idx_pacientes_nome ON pacientes(nome);
CREATE INDEX idx_pacientes_clinica ON pacientes(clinica_id);
CREATE INDEX idx_agendamentos_paciente ON agendamentos(paciente_id);
CREATE INDEX idx_agendamentos_profissional ON agendamentos(profissional_id);
CREATE INDEX idx_agendamentos_data ON agendamentos(data_inicio);
CREATE INDEX idx_pagamentos_status ON pagamentos(status);
CREATE INDEX idx_prontuarios_paciente ON prontuarios(paciente_id);
CREATE INDEX idx_documentos_paciente ON documentos(paciente_id);
CREATE INDEX idx_logs_user ON logs_acesso(user_id);
CREATE INDEX idx_logs_timestamp ON logs_acesso(timestamp);

-- Criar triggers para atualizar campo atualizado_em automaticamente
CREATE OR REPLACE FUNCTION trigger_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_atualizado_em_profissionais
    BEFORE UPDATE ON profissionais
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizado_em();

CREATE TRIGGER set_atualizado_em_pacientes
    BEFORE UPDATE ON pacientes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizado_em();

CREATE TRIGGER set_atualizado_em_agendamentos
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizado_em();

CREATE TRIGGER set_atualizado_em_pagamentos
    BEFORE UPDATE ON pagamentos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizado_em();

CREATE TRIGGER set_ultima_edicao_prontuarios
    BEFORE UPDATE ON prontuarios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizado_em();

-- Inserir dados iniciais de exemplo
INSERT INTO clinicas (nome, cnpj, endereco, pix_chave) VALUES 
('Clínica HealthCare', '12.345.678/0001-90', 'Rua das Flores, 123 - Centro', 'clinica@healthcare.com.br');

-- Criar constraint para CPF único por clínica
ALTER TABLE pacientes ADD CONSTRAINT unique_cpf_por_clinica UNIQUE (clinica_id, cpf);
