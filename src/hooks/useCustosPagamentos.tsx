import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from './useClinica';
import { useCustos } from './useCustos';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CustoPagamento {
  id: string;
  custo_id: string;
  clinica_id: string;
  mes_referencia: string;
  valor_pago: number;
  data_pagamento: string | null;
  observacoes: string | null;
  status: 'pendente' | 'pago' | 'estimado';
  criado_em: string;
  atualizado_em: string;
}

export interface CustoPagamentoInput {
  custo_id: string;
  mes_referencia: string;
  valor_pago: number;
  data_pagamento?: Date;
  observacoes?: string;
  status: 'pendente' | 'pago' | 'estimado';
}

export interface CustoComPagamento {
  custo_id: string;
  nome: string;
  tipo: string;
  frequencia: string;
  valor_estimado: number;
  valor_pago: number | null;
  status: 'pendente' | 'pago' | 'estimado';
  pagamento_id: string | null;
  ultimo_valor_pago: number | null;
}

export function useCustosPagamentos(mesReferencia?: string) {
  const { data: clinica } = useClinica();
  const { custos } = useCustos();
  const queryClient = useQueryClient();
  
  const mesAtual = mesReferencia || format(new Date(), 'yyyy-MM');

  // Buscar pagamentos do mês especificado
  const pagamentosQuery = useQuery({
    queryKey: ['custos-pagamentos', clinica?.id, mesAtual],
    queryFn: async () => {
      if (!clinica?.id) return [];
      
      const { data, error } = await supabase
        .from('custos_pagamentos')
        .select('*')
        .eq('clinica_id', clinica.id)
        .eq('mes_referencia', mesAtual);
      
      if (error) throw error;
      return data as CustoPagamento[];
    },
    enabled: !!clinica?.id,
  });

  // Buscar último valor pago de cada custo (para estimativas)
  const ultimosPagamentosQuery = useQuery({
    queryKey: ['custos-ultimos-pagamentos', clinica?.id],
    queryFn: async () => {
      if (!clinica?.id) return {};
      
      // Buscar os últimos 3 meses de pagamentos
      const tresMesesAtras = format(subMonths(new Date(), 3), 'yyyy-MM');
      
      const { data, error } = await supabase
        .from('custos_pagamentos')
        .select('*')
        .eq('clinica_id', clinica.id)
        .eq('status', 'pago')
        .gte('mes_referencia', tresMesesAtras)
        .order('mes_referencia', { ascending: false });
      
      if (error) throw error;
      
      // Agrupar por custo_id e pegar o mais recente
      const ultimosPorCusto: Record<string, number> = {};
      (data || []).forEach(p => {
        if (!ultimosPorCusto[p.custo_id]) {
          ultimosPorCusto[p.custo_id] = p.valor_pago;
        }
      });
      
      return ultimosPorCusto;
    },
    enabled: !!clinica?.id,
  });

  // Montar lista de custos com status de pagamento (fixos e variáveis mensais)
  const custosComPagamento: CustoComPagamento[] = custos
    .filter(c => c.frequencia === 'mensal' && c.ativo)
    .map(custo => {
      const pagamento = pagamentosQuery.data?.find(p => p.custo_id === custo.id);
      const ultimoValorPago = ultimosPagamentosQuery.data?.[custo.id] || null;
      
      return {
        custo_id: custo.id,
        nome: custo.nome,
        tipo: custo.tipo,
        frequencia: custo.frequencia,
        valor_estimado: custo.valor_estimado,
        valor_pago: pagamento?.valor_pago || null,
        status: pagamento?.status || 'pendente',
        pagamento_id: pagamento?.id || null,
        ultimo_valor_pago: ultimoValorPago,
      };
    });

  // Criar ou atualizar pagamento
  const salvarPagamento = useMutation({
    mutationFn: async (input: CustoPagamentoInput) => {
      if (!clinica?.id) throw new Error('Clínica não encontrada');

      // Verificar se já existe pagamento para este custo/mês
      const { data: existente } = await supabase
        .from('custos_pagamentos')
        .select('id')
        .eq('custo_id', input.custo_id)
        .eq('mes_referencia', input.mes_referencia)
        .maybeSingle();

      if (existente) {
        // Atualizar
        const { data, error } = await supabase
          .from('custos_pagamentos')
          .update({
            valor_pago: input.valor_pago,
            data_pagamento: input.data_pagamento?.toISOString() || null,
            observacoes: input.observacoes || null,
            status: input.status,
          })
          .eq('id', existente.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar
        const { data, error } = await supabase
          .from('custos_pagamentos')
          .insert({
            custo_id: input.custo_id,
            clinica_id: clinica.id,
            mes_referencia: input.mes_referencia,
            valor_pago: input.valor_pago,
            data_pagamento: input.data_pagamento?.toISOString() || null,
            observacoes: input.observacoes || null,
            status: input.status,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success('Pagamento registrado!');
      queryClient.invalidateQueries({ queryKey: ['custos-pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['custos-ultimos-pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['fluxo-caixa'] });
    },
    onError: (error) => {
      console.error('Erro ao salvar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    },
  });

  // Confirmar todos os custos do mês (batch)
  const confirmarTodosMes = useMutation({
    mutationFn: async (pagamentos: CustoPagamentoInput[]) => {
      if (!clinica?.id) throw new Error('Clínica não encontrada');

      for (const pag of pagamentos) {
        await salvarPagamento.mutateAsync(pag);
      }
    },
    onSuccess: () => {
      toast.success('Custos do mês confirmados!');
    },
  });

  // Calcular totais
  const totalEstimado = custosComPagamento.reduce((sum, c) => sum + c.valor_estimado, 0);
  const totalPago = custosComPagamento.reduce((sum, c) => sum + (c.valor_pago || 0), 0);
  const custosPendentes = custosComPagamento.filter(c => c.status === 'pendente').length;
  const custosConfirmados = custosComPagamento.filter(c => c.status === 'pago').length;

  // Verificar se mês precisa de confirmação
  const mesAtualStr = format(new Date(), 'yyyy-MM');
  const mesPassado = mesAtual < mesAtualStr;
  const precisaConfirmacao = mesPassado && custosPendentes > 0;

  return {
    isLoading: pagamentosQuery.isLoading || ultimosPagamentosQuery.isLoading,
    custosComPagamento,
    mesReferencia: mesAtual,
    totalEstimado,
    totalPago,
    custosPendentes,
    custosConfirmados,
    precisaConfirmacao,
    salvarPagamento,
    confirmarTodosMes,
  };
}

// Hook para buscar pagamentos de custos em um range de meses
export function useCustosPagamentosRange(mesesAtras: number = 6) {
  const { data: clinica } = useClinica();
  
  const hoje = new Date();
  const dataInicio = format(startOfMonth(subMonths(hoje, mesesAtras - 1)), 'yyyy-MM');
  const dataFim = format(endOfMonth(hoje), 'yyyy-MM');

  const query = useQuery({
    queryKey: ['custos-pagamentos-range', clinica?.id, dataInicio, dataFim],
    queryFn: async () => {
      if (!clinica?.id) return [];
      
      const { data, error } = await supabase
        .from('custos_pagamentos')
        .select('*')
        .eq('clinica_id', clinica.id)
        .gte('mes_referencia', dataInicio)
        .lte('mes_referencia', dataFim)
        .order('mes_referencia', { ascending: true });
      
      if (error) throw error;
      return data as CustoPagamento[];
    },
    enabled: !!clinica?.id,
  });

  // Agrupar por mês
  const pagamentosPorMes: Record<string, CustoPagamento[]> = {};
  (query.data || []).forEach(p => {
    if (!pagamentosPorMes[p.mes_referencia]) {
      pagamentosPorMes[p.mes_referencia] = [];
    }
    pagamentosPorMes[p.mes_referencia].push(p);
  });

  return {
    isLoading: query.isLoading,
    pagamentos: query.data || [],
    pagamentosPorMes,
  };
}
