-- Corrigir o trigger para atualizar 'ultima_edicao' em vez de 'atualizado_em'
DROP TRIGGER IF EXISTS set_ultima_edicao_prontuarios ON public.prontuarios;

-- Criar função específica para atualizar ultima_edicao
CREATE OR REPLACE FUNCTION public.trigger_ultima_edicao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ultima_edicao = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger correto para prontuários
CREATE TRIGGER set_ultima_edicao_prontuarios
    BEFORE UPDATE ON public.prontuarios
    FOR EACH ROW EXECUTE FUNCTION public.trigger_ultima_edicao();