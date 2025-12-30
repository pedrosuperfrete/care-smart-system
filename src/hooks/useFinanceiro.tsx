
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

type Pagamento = Tables<'pagamentos'>;
type UpdatePagamento = Partial<Pagamento>;

export function usePagamentos(startDate?: Date, endDate?: Date) {
  const { user, userProfile } = useAuth();
  
  return useQuery({
    queryKey: ['pagamentos', startDate, endDate],
    queryFn: async () => {
      console.log('Buscando pagamentos com user:', user);
      
      if (!user?.id || !userProfile) {
        console.error('User ou userProfile não disponível para buscar pagamentos');
        return [];
      }

      let agendamentoIds: string[] = [];

      // Se for profissional, buscar seus próprios agendamentos
      if (userProfile.tipo_usuario === 'profissional') {
        const { data: profissionalAtual, error: profError } = await supabase
          .from('profissionais')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profError || !profissionalAtual) {
          console.log('Profissional não encontrado para o usuário:', user.id);
          return [];
        }

        console.log('Buscando pagamentos para profissional:', profissionalAtual.id);

        const { data: agendamentos, error: agendamentosError } = await supabase
          .from('agendamentos')
          .select('id')
          .eq('profissional_id', profissionalAtual.id);

        if (agendamentosError) {
          console.error('Erro ao buscar agendamentos:', agendamentosError);
          throw agendamentosError;
        }

        agendamentoIds = agendamentos?.map(a => a.id) || [];
      } 
      // Se for recepcionista, buscar agendamentos da clínica
      else if (userProfile.tipo_usuario === 'recepcionista') {
        // Buscar clínica do usuário
        const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
        
        if (!clinicasUsuario || clinicasUsuario.length === 0) {
          console.log('Nenhuma clínica encontrada para recepcionista');
          return [];
        }

        const clinicaId = clinicasUsuario[0].clinica_id;
        console.log('Buscando pagamentos para clínica:', clinicaId);

        // Buscar profissionais da clínica
        const { data: profissionais, error: profError } = await supabase
          .from('profissionais')
          .select('id')
          .eq('clinica_id', clinicaId)
          .eq('ativo', true);

        if (profError || !profissionais || profissionais.length === 0) {
          console.log('Nenhum profissional encontrado na clínica');
          return [];
        }

        const profissionalIds = profissionais.map(p => p.id);

        // Buscar agendamentos de todos os profissionais da clínica
        const { data: agendamentos, error: agendamentosError } = await supabase
          .from('agendamentos')
          .select('id')
          .in('profissional_id', profissionalIds);

        if (agendamentosError) {
          console.error('Erro ao buscar agendamentos da clínica:', agendamentosError);
          throw agendamentosError;
        }

        agendamentoIds = agendamentos?.map(a => a.id) || [];
      }
      // Se for admin, buscar todos
      else if (userProfile.tipo_usuario === 'admin') {
        const { data: agendamentos, error: agendamentosError } = await supabase
          .from('agendamentos')
          .select('id');

        if (agendamentosError) {
          console.error('Erro ao buscar todos agendamentos:', agendamentosError);
          throw agendamentosError;
        }

        agendamentoIds = agendamentos?.map(a => a.id) || [];
      }

      if (agendamentoIds.length === 0) {
        console.log('Nenhum agendamento encontrado');
        return [];
      }

      console.log('IDs dos agendamentos encontrados:', agendamentoIds);

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
            servicos_adicionais,
            data_inicio,
            status,
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
              clinica_id,
              crm_cro
            )
          )
        `)
        .in('agendamento_id', agendamentoIds)
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
    enabled: !!user?.id && !!userProfile,
  });
}

export function useUpdatePagamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePagamento }) => {
      console.log('Atualizando pagamento:', id, data);
      
      // Se estiver marcando como pago e não foi especificado valor_pago, usar valor_total
      if (data.status === 'pago' && !data.valor_pago) {
        const { data: pagamento } = await supabase
          .from('pagamentos')
          .select('valor_total')
          .eq('id', id)
          .single();
        
        if (pagamento) {
          data.valor_pago = pagamento.valor_total;
        }
      }
      
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
  const { user, userProfile } = useAuth();
  
  return useQuery({
    queryKey: ['financeiro-stats', startDate, endDate],
    queryFn: async () => {
      console.log('Calculando estatísticas financeiras com user:', user);
      
      if (!user?.id || !userProfile) {
        console.error('User ou userProfile não disponível para calcular estatísticas');
        return {
          totalRecebido: 0,
          totalPendente: 0,
          totalVencido: 0,
          receitaMensal: 0,
        };
      }

      let agendamentoIds: string[] = [];

      // Se for profissional, buscar seus próprios agendamentos
      if (userProfile.tipo_usuario === 'profissional') {
        const { data: profissionalAtual, error: profError } = await supabase
          .from('profissionais')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profError || !profissionalAtual) {
          console.log('Profissional não encontrado para o usuário:', user.id);
          return {
            totalRecebido: 0,
            totalPendente: 0,
            totalVencido: 0,
            receitaMensal: 0,
          };
        }

        const { data: agendamentos, error: agendamentosError } = await supabase
          .from('agendamentos')
          .select('id')
          .eq('profissional_id', profissionalAtual.id);

        if (agendamentosError) {
          console.error('Erro ao buscar agendamentos para stats:', agendamentosError);
          throw agendamentosError;
        }

        agendamentoIds = agendamentos?.map(a => a.id) || [];
      } 
      // Se for recepcionista, buscar agendamentos da clínica
      else if (userProfile.tipo_usuario === 'recepcionista') {
        // Buscar clínica do usuário
        const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
        
        if (!clinicasUsuario || clinicasUsuario.length === 0) {
          return {
            totalRecebido: 0,
            totalPendente: 0,
            totalVencido: 0,
            receitaMensal: 0,
          };
        }

        const clinicaId = clinicasUsuario[0].clinica_id;

        // Buscar profissionais da clínica
        const { data: profissionais, error: profError } = await supabase
          .from('profissionais')
          .select('id')
          .eq('clinica_id', clinicaId)
          .eq('ativo', true);

        if (profError || !profissionais || profissionais.length === 0) {
          return {
            totalRecebido: 0,
            totalPendente: 0,
            totalVencido: 0,
            receitaMensal: 0,
          };
        }

        const profissionalIds = profissionais.map(p => p.id);

        // Buscar agendamentos de todos os profissionais da clínica
        const { data: agendamentos, error: agendamentosError } = await supabase
          .from('agendamentos')
          .select('id')
          .in('profissional_id', profissionalIds);

        if (agendamentosError) {
          console.error('Erro ao buscar agendamentos da clínica para stats:', agendamentosError);
          throw agendamentosError;
        }

        agendamentoIds = agendamentos?.map(a => a.id) || [];
      }
      // Se for admin, buscar todos
      else if (userProfile.tipo_usuario === 'admin') {
        const { data: agendamentos, error: agendamentosError } = await supabase
          .from('agendamentos')
          .select('id');

        if (agendamentosError) {
          console.error('Erro ao buscar todos agendamentos para stats:', agendamentosError);
          throw agendamentosError;
        }

        agendamentoIds = agendamentos?.map(a => a.id) || [];
      }

      if (agendamentoIds.length === 0) {
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
          agendamento_id,
          agendamentos!fk_pagamento_agendamento (
            status,
            valor
          )
        `)
        .in('agendamento_id', agendamentoIds);
      
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

      let totalRecebido = 0;
      let totalPendente = 0; // A Receber: pagamentos que temos certeza que precisamos receber
      let totalVencido = 0;

      // IDs de agendamentos que já tem pagamento associado
      const agendamentosComPagamento = new Set<string>();

      data?.forEach(pagamento => {
        const valorTotal = Number(pagamento.valor_total) || 0;
        const valorPago = Number(pagamento.valor_pago) || 0;
        const dataVencimento = pagamento.data_vencimento ? new Date(pagamento.data_vencimento) : null;
        const statusAgendamento = (pagamento as any).agendamentos?.status;
        const agendamentoId = pagamento.agendamento_id;

        if (agendamentoId) {
          agendamentosComPagamento.add(agendamentoId);
        }

        // Status dos pagamentos
        if (pagamento.status === 'pago') {
          totalRecebido += valorPago > 0 ? valorPago : valorTotal;
        } else if (pagamento.status === 'pendente') {
          if (dataVencimento && dataVencimento < agora) {
            totalVencido += valorTotal - valorPago;
          } else {
            // A Receber: apenas pagamentos de agendamentos realizados ou falta
            // (pagamentos confirmados que temos certeza que precisamos receber)
            if (statusAgendamento === 'realizado' || statusAgendamento === 'falta') {
              totalPendente += valorTotal - valorPago;
            }
            // Pagamentos de agendamento confirmado (taxa de confirmação) também entram em A Receber
            if (statusAgendamento === 'confirmado') {
              totalPendente += valorTotal - valorPago;
            }
          }
        }
      });

      // A Ganhar: valor total de agendamentos pendentes ou confirmados (que ainda não foram realizados)
      // Isso representa o potencial de receita se as consultas forem realizadas
      const { data: agendamentosFuturos, error: agendamentosFuturosError } = await supabase
        .from('agendamentos')
        .select('valor, status, id')
        .in('id', agendamentoIds)
        .in('status', ['pendente', 'confirmado']);

      let receitaMensal = 0;
      if (!agendamentosFuturosError && agendamentosFuturos) {
        agendamentosFuturos.forEach(ag => {
          const valorAg = Number(ag.valor) || 0;
          receitaMensal += valorAg;
        });
      }

      const stats = {
        totalRecebido,
        totalPendente,
        totalVencido,
        receitaMensal,
      };
      
      console.log('Estatísticas calculadas:', stats);
      return stats;
    },
    enabled: !!user?.id && !!userProfile,
  });
}
