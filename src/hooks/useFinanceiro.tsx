import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

type Pagamento = Tables<'pagamentos'>;
type UpdatePagamento = Partial<Pagamento>;

export function usePagamentos() {
  const { user, loading: authLoading } = useAuth();
  
  console.log('usePagamentos - User carregado:', user);
  console.log('usePagamentos - Status do loading:', authLoading);
  
  return useQuery({
    queryKey: ['pagamentos'],
    queryFn: async () => {
      console.log('usePagamentos - Executando query, user.id:', user?.id);
      
      if (!user?.id) {
        console.error('usePagamentos - User não disponível:', user);
        throw new Error('Usuário não autenticado');
      }

      try {
        // First, get pagamentos with agendamento_id
        const { data: pagamentosData, error: pagamentosError } = await supabase
          .from('pagamentos')
          .select('*')
          .order('criado_em', { ascending: false });
        
        if (pagamentosError) {
          console.error('usePagamentos - Erro na query de pagamentos:', pagamentosError);
          throw pagamentosError;
        }

        console.log('usePagamentos - Pagamentos carregados:', pagamentosData?.length || 0);

        // If we have pagamentos, get the related agendamentos data
        if (pagamentosData && pagamentosData.length > 0) {
          const agendamentoIds = pagamentosData
            .map(p => p.agendamento_id)
            .filter(id => id !== null);

          if (agendamentoIds.length > 0) {
            const { data: agendamentosData, error: agendamentosError } = await supabase
              .from('agendamentos')
              .select(`
                id,
                tipo_servico,
                data_inicio,
                pacientes(id, nome, email, telefone),
                profissionais(id, nome, especialidade)
              `)
              .in('id', agendamentoIds);

            if (agendamentosError) {
              console.error('usePagamentos - Erro na query de agendamentos:', agendamentosError);
              // Continue without agendamentos data rather than failing completely
            }

            // Combine the data
            const combinedData = pagamentosData.map(pagamento => ({
              ...pagamento,
              agendamentos: agendamentosData?.find(a => a.id === pagamento.agendamento_id) || null
            }));

            console.log('usePagamentos - Dados combinados:', combinedData.length, 'pagamentos');
            return combinedData;
          }
        }
        
        console.log('usePagamentos - Retornando pagamentos sem agendamentos:', pagamentosData?.length || 0);
        return pagamentosData?.map(p => ({ ...p, agendamentos: null })) || [];
      } catch (error) {
        console.error('usePagamentos - Erro ao acessar dados:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !authLoading,
  });
}

export function useUpdatePagamento() {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  
  console.log('useUpdatePagamento - User carregado:', user);
  console.log('useUpdatePagamento - Status do loading:', authLoading);
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePagamento }) => {
      console.log('useUpdatePagamento - Executando mutation, user.id:', user?.id);
      
      if (!user?.id) {
        console.error('useUpdatePagamento - User não disponível:', user);
        throw new Error('Usuário não autenticado');
      }

      try {
        const { data: updated, error } = await supabase
          .from('pagamentos')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('useUpdatePagamento - Erro na mutation:', error);
          throw error;
        }
        
        console.log('useUpdatePagamento - Pagamento atualizado:', updated);
        return updated;
      } catch (error) {
        console.error('useUpdatePagamento - Erro ao atualizar pagamento:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast.success('Pagamento atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('useUpdatePagamento - Erro na mutation:', error);
      toast.error('Erro ao atualizar pagamento: ' + error.message);
    },
  });
}

export function useMarcarPago() {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  
  console.log('useMarcarPago - User carregado:', user);
  console.log('useMarcarPago - Status do loading:', authLoading);
  
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('useMarcarPago - Executando mutation, user.id:', user?.id);
      
      if (!user?.id) {
        console.error('useMarcarPago - User não disponível:', user);
        throw new Error('Usuário não autenticado');
      }

      try {
        const { data: updated, error } = await supabase
          .from('pagamentos')
          .update({ 
            status: 'pago',
            data_pagamento: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('useMarcarPago - Erro na mutation:', error);
          throw error;
        }
        
        console.log('useMarcarPago - Pagamento marcado como pago:', updated);
        return updated;
      } catch (error) {
        console.error('useMarcarPago - Erro ao marcar como pago:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast.success('Pagamento marcado como pago!');
    },
    onError: (error: any) => {
      console.error('useMarcarPago - Erro na mutation:', error);
      toast.error('Erro ao marcar pagamento como pago: ' + error.message);
    },
  });
}

export function useFinanceiroStats(startDate?: Date, endDate?: Date) {
  const { user, loading: authLoading } = useAuth();
  
  console.log('useFinanceiroStats - User carregado:', user);
  console.log('useFinanceiroStats - Status do loading:', authLoading);
  console.log('useFinanceiroStats - Período:', { startDate, endDate });
  
  return useQuery({
    queryKey: ['financeiro-stats', startDate, endDate],
    queryFn: async () => {
      console.log('useFinanceiroStats - Executando query, user.id:', user?.id);
      
      if (!user?.id) {
        console.error('useFinanceiroStats - User não disponível:', user);
        throw new Error('Usuário não autenticado');
      }

      try {
        let query = supabase
          .from('pagamentos')
          .select('valor_total, valor_pago, status, data_pagamento, data_vencimento');

        if (startDate && endDate) {
          query = query
            .gte('criado_em', startDate.toISOString())
            .lte('criado_em', endDate.toISOString());
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('useFinanceiroStats - Erro na query:', error);
          throw error;
        }

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

        const stats = {
          totalRecebido,
          totalPendente,
          totalVencido,
          receitaMensal,
        };
        
        console.log('useFinanceiroStats - Stats calculadas:', stats);
        return stats;
      } catch (error) {
        console.error('useFinanceiroStats - Erro ao calcular estatísticas:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !authLoading,
  });
}
