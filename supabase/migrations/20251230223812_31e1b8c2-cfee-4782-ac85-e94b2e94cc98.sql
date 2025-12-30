-- Ajustar trigger para executar também no INSERT (não só UPDATE)
DROP TRIGGER IF EXISTS trigger_auto_gerar_pagamento ON public.agendamentos;

CREATE TRIGGER trigger_auto_gerar_pagamento
AFTER INSERT OR UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.auto_gerar_pagamento();