import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from './useClinica';
import { useCustos } from './useCustos';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, format, eachMonthOfInterval, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DespesaAvulsa {
  id: string;
  clinica_id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data_pagamento: string;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface DespesaAvulsaInput {
  descricao: string;
  valor: number;
  categoria: string;
  data_pagamento: Date;
  observacoes?: string;
}

export interface FluxoMensal {
  mes: string;
  mesFormatado: string;
  receitas: number;
  despesasFixas: number;
  despesasVariaveis: number;
  despesasAvulsas: number;
  totalDespesas: number;
  saldo: number;
  atendimentosRealizados: number;
}

const categoriasDespesa = [
  'Aluguel',
  'Funcionários',
  'Contas (luz, água, internet)',
  'Materiais',
  'Equipamentos',
  'Marketing',
  'Impostos',
  'Manutenção',
  'Outros',
];

export function useDespesasAvulsas(startDate?: Date, endDate?: Date) {
  const { data: clinica } = useClinica();
  const queryClient = useQueryClient();

  const despesasQuery = useQuery({
    queryKey: ['despesas-avulsas', clinica?.id, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (!clinica?.id) return [];
      
      let query = supabase
        .from('despesas_avulsas')
        .select('*')
        .eq('clinica_id', clinica.id)
        .order('data_pagamento', { ascending: false });
      
      if (startDate) {
        query = query.gte('data_pagamento', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('data_pagamento', endDate.toISOString());
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as DespesaAvulsa[];
    },
    enabled: !!clinica?.id,
  });

  const criarDespesa = useMutation({
    mutationFn: async (input: DespesaAvulsaInput) => {
      if (!clinica?.id) throw new Error('Clínica não encontrada');

      const { data, error } = await supabase
        .from('despesas_avulsas')
        .insert({
          clinica_id: clinica.id,
          descricao: input.descricao,
          valor: input.valor,
          categoria: input.categoria,
          data_pagamento: input.data_pagamento.toISOString(),
          observacoes: input.observacoes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Despesa registrada!');
      queryClient.invalidateQueries({ queryKey: ['despesas-avulsas'] });
      queryClient.invalidateQueries({ queryKey: ['fluxo-caixa'] });
    },
    onError: (error) => {
      console.error('Erro ao criar despesa:', error);
      toast.error('Erro ao registrar despesa');
    },
  });

  const deletarDespesa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('despesas_avulsas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Despesa excluída!');
      queryClient.invalidateQueries({ queryKey: ['despesas-avulsas'] });
      queryClient.invalidateQueries({ queryKey: ['fluxo-caixa'] });
    },
    onError: (error) => {
      console.error('Erro ao excluir despesa:', error);
      toast.error('Erro ao excluir despesa');
    },
  });

  return {
    despesas: despesasQuery.data || [],
    isLoading: despesasQuery.isLoading,
    criarDespesa,
    deletarDespesa,
    categorias: categoriasDespesa,
  };
}

export function useFluxoCaixa(mesesAtras: number = 6) {
  const { data: clinica } = useClinica();
  const { custos } = useCustos();

  // Calcular período
  const hoje = new Date();
  const dataInicio = startOfMonth(subMonths(hoje, mesesAtras - 1));
  const dataFim = endOfMonth(hoje);

  // Buscar receitas (pagamentos recebidos)
  const receitasQuery = useQuery({
    queryKey: ['fluxo-caixa-receitas', clinica?.id, dataInicio.toISOString()],
    queryFn: async () => {
      if (!clinica?.id) return [];

      const { data, error } = await supabase
        .from('pagamentos')
        .select(`
          *,
          agendamentos!inner(
            profissional_id,
            profissionais!inner(clinica_id)
          )
        `)
        .eq('agendamentos.profissionais.clinica_id', clinica.id)
        .eq('status', 'pago')
        .gte('data_pagamento', dataInicio.toISOString())
        .lte('data_pagamento', dataFim.toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!clinica?.id,
  });

  // Buscar despesas avulsas
  const despesasAvulsasQuery = useQuery({
    queryKey: ['fluxo-caixa-despesas', clinica?.id, dataInicio.toISOString()],
    queryFn: async () => {
      if (!clinica?.id) return [];

      const { data, error } = await supabase
        .from('despesas_avulsas')
        .select('*')
        .eq('clinica_id', clinica.id)
        .gte('data_pagamento', dataInicio.toISOString())
        .lte('data_pagamento', dataFim.toISOString());

      if (error) throw error;
      return data as DespesaAvulsa[];
    },
    enabled: !!clinica?.id,
  });

  // Buscar atendimentos realizados para calcular custos variáveis
  const atendimentosQuery = useQuery({
    queryKey: ['fluxo-caixa-atendimentos', clinica?.id, dataInicio.toISOString()],
    queryFn: async () => {
      if (!clinica?.id) return [];

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          profissionais!inner(clinica_id)
        `)
        .eq('profissionais.clinica_id', clinica.id)
        .eq('status', 'realizado')
        .gte('data_inicio', dataInicio.toISOString())
        .lte('data_inicio', dataFim.toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!clinica?.id,
  });

  // Calcular custos fixos e variáveis
  const custoFixoMensal = custos
    .filter(c => c.tipo === 'fixo' && c.frequencia === 'mensal')
    .reduce((sum, c) => sum + Number(c.valor), 0);

  const custoVariavelPorAtendimento = custos
    .filter(c => c.tipo === 'variavel' && c.frequencia === 'por_atendimento')
    .reduce((sum, c) => sum + Number(c.valor), 0);

  // Gerar fluxo por mês
  const meses = eachMonthOfInterval({ start: dataInicio, end: dataFim });
  
  // Processar pagamentos parcelados - distribuir receita pelos meses
  const receitasPorMes: Record<string, number> = {};
  
  (receitasQuery.data || []).forEach(p => {
    if (!p.data_pagamento) return;
    
    const parcelasTotais = p.parcelas_totais || 1;
    const valorParcela = (Number(p.valor_pago) || 0) / parcelasTotais;
    const dataPagamento = new Date(p.data_pagamento);
    
    // Distribuir o valor pelas parcelas
    for (let i = 0; i < parcelasTotais; i++) {
      const mesParcela = addMonths(dataPagamento, i);
      const mesKey = format(mesParcela, 'yyyy-MM');
      receitasPorMes[mesKey] = (receitasPorMes[mesKey] || 0) + valorParcela;
    }
  });
  
  const fluxoMensal: FluxoMensal[] = meses.map(mes => {
    const mesKey = format(mes, 'yyyy-MM');
    const mesFormatado = format(mes, 'MMM/yy', { locale: ptBR });
    
    // Receitas do mês (agora incluindo parcelas distribuídas)
    const receitasMes = receitasPorMes[mesKey] || 0;

    // Atendimentos do mês
    const atendimentosMes = (atendimentosQuery.data || [])
      .filter(a => format(new Date(a.data_inicio), 'yyyy-MM') === mesKey)
      .length;

    // Despesas avulsas do mês
    const despesasAvulsasMes = (despesasAvulsasQuery.data || [])
      .filter(d => format(new Date(d.data_pagamento), 'yyyy-MM') === mesKey)
      .reduce((sum, d) => sum + Number(d.valor), 0);

    // Custo variável total (baseado em atendimentos)
    const despesasVariaveisMes = atendimentosMes * custoVariavelPorAtendimento;

    const totalDespesas = custoFixoMensal + despesasVariaveisMes + despesasAvulsasMes;
    const saldo = receitasMes - totalDespesas;

    return {
      mes: mesKey,
      mesFormatado,
      receitas: receitasMes,
      despesasFixas: custoFixoMensal,
      despesasVariaveis: despesasVariaveisMes,
      despesasAvulsas: despesasAvulsasMes,
      totalDespesas,
      saldo,
      atendimentosRealizados: atendimentosMes,
    };
  });

  // Totais
  const totalReceitas = fluxoMensal.reduce((sum, m) => sum + m.receitas, 0);
  const totalDespesas = fluxoMensal.reduce((sum, m) => sum + m.totalDespesas, 0);
  const saldoTotal = totalReceitas - totalDespesas;
  const mediaReceitaMensal = totalReceitas / meses.length;
  const mediaDespesaMensal = totalDespesas / meses.length;

  return {
    isLoading: receitasQuery.isLoading || despesasAvulsasQuery.isLoading || atendimentosQuery.isLoading,
    fluxoMensal,
    totalReceitas,
    totalDespesas,
    saldoTotal,
    mediaReceitaMensal,
    mediaDespesaMensal,
    custoFixoMensal,
    custoVariavelPorAtendimento,
  };
}
