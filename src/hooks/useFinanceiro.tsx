
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

type Pagamento = Tables<'pagamentos'>;
type UpdatePagamento = Partial<Pagamento>;

export function usePagamentos(startDate?: Date, endDate?: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['pagamentos', startDate, endDate],
    queryFn: async () => {
      console.log('Buscando pagamentos com user:', user);
      
      if (!user?.id) {
        console.error('User não disponível para buscar pagamentos');
        return [];
      }

      // Buscar o profissional atual
      const { data: profissionalAtual, error: profError } = await supabase
        .from('profissionais')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profError || !profissionalAtual) {
        console.log('Profissional não encontrado para o usuário:', user.id);
        return [];
      }

      let query = supabase
        .from('pagamentos')
        .select(`
          id,
          valor_total,
          valor_pago,
          status,
          data_pagamento,
          data_vencimento,
          forma_pagamento,
          criado_em,
          agendamento_id,
          agendamentos!fk_pagamento_agendamento (
            id,
            tipo_servico,
            data_inicio,
            paciente_id,
            profissional_id,
            pacientes (
              id,
              nome,
              email,
              telefone
            ),
            profissionais (
              id,
              nome,
              especialidade,
              clinica_id
            )
          )
        `)
        .eq('agendamentos.profissional_id', profissionalAtual.id)
        .order('criado_em', { ascending: false });

      // Filtrar por data se fornecido
      if (startDate) {
        query = query.gte('criado_em', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('criado_em', endDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar pagamentos:', error);
        throw error;
      }
      
      console.log('Pagamentos carregados:', data);
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useUpdatePagamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePagamento }) => {
      console.log('Atualizando pagamento:', id, data);
      
      const { data: updated, error } = await supabase
        .from('pagamentos')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar pagamento:', error);
        throw error;
      }
      
      console.log('Pagamento atualizado:', updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast.success('Pagamento atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na mutação de pagamento:', error);
      toast.error('Erro ao atualizar pagamento: ' + error.message);
    },
  });
}

export function useMarcarPago() {
  return useUpdatePagamento();
}

export function useFinanceiroStats(startDate?: Date, endDate?: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['financeiro-stats', startDate, endDate],
    queryFn: async () => {
      console.log('Calculando estatísticas financeiras com user:', user);
      
      if (!user?.id) {
        console.error('User não disponível para calcular estatísticas');
        return {
          totalRecebido: 0,
          totalPendente: 0,
          totalVencido: 0,
          receitaMensal: 0,
        };
      }

      // Buscar o profissional atual
      const { data: profissionalAtual, error: profError } = await supabase
        .from('profissionais')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profError || !profissionalAtual) {
        console.log('Profissional não encontrado para o usuário:', user.id);
        return {
          totalRecebido: 0,
          totalPendente: 0,
          totalVencido: 0,
          receitaMensal: 0,
        };
      }

      let query = supabase
        .from('pagamentos')
        .select(`
          valor_total, 
          valor_pago, 
          status, 
          data_pagamento, 
          data_vencimento, 
          criado_em,
          agendamentos!fk_pagamento_agendamento(
            profissional_id
          )
        `)
        .eq('agendamentos.profissional_id', profissionalAtual.id);
      
      // Filtrar por data se fornecido
      if (startDate) {
        query = query.gte('criado_em', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('criado_em', endDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar dados para estatísticas:', error);
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
      
      console.log('Estatísticas calculadas:', stats);
      return stats;
    },
    enabled: !!user?.id,
  });
}
