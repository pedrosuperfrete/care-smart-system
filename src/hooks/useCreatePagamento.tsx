
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreatePagamentoData {
  paciente_id: string;
  servico_prestado: string;
  valor_total: number;
  forma_pagamento: 'dinheiro' | 'cartao' | 'pix' | 'link';
  status: 'pendente' | 'pago' | 'vencido';
  data_vencimento?: Date;
  data_pagamento?: Date;
  valor_pago?: number;
}

export function useCreatePagamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreatePagamentoData) => {
      console.log('Criando pagamento manual:', data);
      
      // Buscar o profissional atual primeiro
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Usuário não autenticado');

      const { data: profissional } = await supabase
        .from('profissionais')
        .select('id')
        .eq('user_id', currentUser.user.id)
        .eq('ativo', true)
        .single();

      if (!profissional) throw new Error('Profissional não encontrado');
      
      // Primeiro, vamos criar um agendamento
      const agendamentoData = {
        paciente_id: data.paciente_id,
        profissional_id: profissional.id,
        tipo_servico: data.servico_prestado,
        data_inicio: data.data_vencimento ? data.data_vencimento.toISOString() : new Date().toISOString(),
        data_fim: data.data_vencimento ? new Date(data.data_vencimento.getTime() + 60 * 60 * 1000).toISOString() : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        status: data.status === 'pago' ? 'realizado' as const : 'pendente' as const,
        confirmado_pelo_paciente: true,
        valor: data.valor_total,
        observacoes: `Pagamento manual - Serviço: ${data.servico_prestado}`,
      };

      const { data: agendamento, error: agendamentoError } = await supabase
        .from('agendamentos')
        .insert(agendamentoData)
        .select()
        .single();

      if (agendamentoError) {
        console.error('Erro ao criar agendamento:', agendamentoError);
        throw agendamentoError;
      }

      // Agora criar o pagamento
      const pagamentoData = {
        agendamento_id: agendamento.id,
        valor_total: data.valor_total,
        valor_pago: data.status === 'pago' ? (data.valor_pago || data.valor_total) : 0,
        forma_pagamento: data.forma_pagamento,
        status: data.status,
        data_vencimento: data.data_vencimento?.toISOString(),
        data_pagamento: data.data_pagamento?.toISOString(),
      };

      const { data: pagamento, error: pagamentoError } = await supabase
        .from('pagamentos')
        .insert(pagamentoData)
        .select()
        .single();

      if (pagamentoError) {
        console.error('Erro ao criar pagamento:', pagamentoError);
        throw pagamentoError;
      }

      console.log('Pagamento criado com sucesso:', pagamento);
      return pagamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast.success('Pagamento criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na criação de pagamento:', error);
      toast.error('Erro ao criar pagamento: ' + error.message);
    },
  });
}
