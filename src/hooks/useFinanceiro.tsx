
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Pagamento = Tables<'pagamentos'>;
type UpdatePagamento = Partial<Pagamento>;

export function usePagamentos() {
  return useQuery({
    queryKey: ['pagamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagamentos')
        .select(`
          *,
          agendamentos(
            id,
            tipo_servico,
            data_inicio,
            pacientes(id, nome, email, telefone),
            profissionais(id, nome, especialidade)
          )
        `)
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdatePagamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePagamento }) => {
      const { data: updated, error } = await supabase
        .from('pagamentos')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast.success('Pagamento atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar pagamento: ' + error.message);
    },
  });
}

export function useMarcarPago() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: updated, error } = await supabase
        .from('pagamentos')
        .update({ 
          status: 'pago',
          data_pagamento: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast.success('Pagamento marcado como pago!');
    },
    onError: (error: any) => {
      toast.error('Erro ao marcar pagamento como pago: ' + error.message);
    },
  });
}

export function useFinanceiroStats(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['financeiro-stats', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('pagamentos')
        .select('valor_total, valor_pago, status, data_pagamento, data_vencimento');

      if (startDate && endDate) {
        query = query
          .gte('criado_em', startDate.toISOString())
          .lte('criado_em', endDate.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

      let totalRecebido = 0;
      let totalPendente = 0;
      let totalVencido = 0;
      let receitaMensal = 0;

      data?.forEach(pagamento => {
        const valorTotal = Number(pagamento.valor_total) || 0;
        const valorPago = Number(pagamento.valor_pago) || 0;
        const dataVencimento = pagamento.data_vencimento ? new Date(pagamento.data_vencimento) : null;
        const dataPagamento = pagamento.data_pagamento ? new Date(pagamento.data_pagamento) : null;

        // Receita mensal (pagamentos recebidos no mês)
        if (dataPagamento && dataPagamento >= inicioMes && dataPagamento <= fimMes) {
          receitaMensal += valorPago;
        }

        // Status dos pagamentos
        if (pagamento.status === 'pago') {
          totalRecebido += valorPago;
        } else if (pagamento.status === 'pendente') {
          if (dataVencimento && dataVencimento < agora) {
            totalVencido += valorTotal - valorPago;
          } else {
            totalPendente += valorTotal - valorPago;
          }
        }
      });

      return {
        totalRecebido,
        totalPendente,
        totalVencido,
        receitaMensal,
      };
    },
  });
}
