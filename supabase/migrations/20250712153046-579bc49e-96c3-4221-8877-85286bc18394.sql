-- Adicionar coluna conteudo se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'modelos_prontuarios' 
        AND column_name = 'conteudo'
    ) THEN
        ALTER TABLE modelos_prontuarios ADD COLUMN conteudo TEXT;
    END IF;
END $$;

-- Inserir alguns templates padrão se a tabela estiver vazia
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM modelos_prontuarios WHERE nome = 'SOAP') THEN
        INSERT INTO modelos_prontuarios (nome, conteudo, especialidade) 
        VALUES ('SOAP', '**SUBJETIVO**
Queixa principal:
História da doença atual:
Antecedentes pessoais:
Antecedentes familiares:

**OBJETIVO**
Exame físico:
Sinais vitais:
Exames complementares:

**AVALIAÇÃO**
Hipótese diagnóstica:
Diagnóstico diferencial:

**PLANO**
Tratamento:
Prescrições:
Orientações:
Retorno:', 'medicina');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM modelos_prontuarios WHERE nome = 'Odontológico') THEN
        INSERT INTO modelos_prontuarios (nome, conteudo, especialidade) 
        VALUES ('Odontológico', '**ANAMNESE**
Queixa principal:
História da doença atual:
Antecedentes médicos:
Medicamentos em uso:

**EXAME CLÍNICO**
Exame extraoral:
Exame intraoral:
Periodonto:
Oclusão:

**DIAGNÓSTICO**
Diagnóstico clínico:

**PLANO DE TRATAMENTO**
Procedimentos indicados:
Orientações de higiene:
Retorno:', 'odontologia');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM modelos_prontuarios WHERE nome = 'Livre') THEN
        INSERT INTO modelos_prontuarios (nome, conteudo, especialidade) 
        VALUES ('Livre', '', 'geral');
    END IF;
END $$;