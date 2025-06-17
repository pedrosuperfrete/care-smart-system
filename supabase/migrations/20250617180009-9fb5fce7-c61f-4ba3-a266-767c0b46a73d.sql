
-- Primeiro, vamos verificar e corrigir os relacionamentos entre pagamentos e agendamentos
-- Adicionar foreign key explícita se não existir
ALTER TABLE pagamentos 
ADD CONSTRAINT fk_pagamento_agendamento 
FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id);

-- Verificar se existe foreign key reversa e remover se causar conflito
-- (isso resolve o erro PGRST201 de relacionamentos duplicados)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'agendamentos_pagamento_id_fkey'
    ) THEN
        ALTER TABLE agendamentos DROP CONSTRAINT agendamentos_pagamento_id_fkey;
    END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_agendamento_id ON pagamentos(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data_pagamento ON pagamentos(data_pagamento);
