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
  parcelas: number;
  criado_em: string;
  atualizado_em: string;
}

export interface DespesaAvulsaInput {
  descricao: string;
  valor: number;
  categoria: string;
  data_pagamento: Date;
  observacoes?: string;
  parcelas?: number;
}

export interface FluxoMensal {
  mes: string;
  mesFormatado: string;
  receitas: number;
  receitaBruta: number;
  taxasCartao: number;
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
          parcelas: input.parcelas || 1,
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

  // Primeiro buscar IDs dos profissionais da clínica
  const profissionaisQuery = useQuery({
    queryKey: ['fluxo-caixa-profissionais', clinica?.id],
    queryFn: async () => {
      if (!clinica?.id) return [];
      
      const { data, error } = await supabase
        .from('profissionais')
        .select('id')
        .eq('clinica_id', clinica.id)
        .eq('ativo', true);

      if (error) throw error;
      return (data || []).map(p => p.id);
    },
    enabled: !!clinica?.id,
  });

  // Buscar agendamentos para depois filtrar os pagamentos
  const agendamentosIdsQuery = useQuery({
    queryKey: ['fluxo-caixa-agendamentos-ids', profissionaisQuery.data],
    queryFn: async () => {
      if (!profissionaisQuery.data || profissionaisQuery.data.length === 0) return [];
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select('id')
        .in('profissional_id', profissionaisQuery.data);

      if (error) throw error;
      return (data || []).map(a => a.id);
    },
    enabled: !!profissionaisQuery.data && profissionaisQuery.data.length > 0,
  });

  // Buscar receitas (pagamentos recebidos) usando os IDs de agendamentos
  const receitasQuery = useQuery({
    queryKey: ['fluxo-caixa-receitas', agendamentosIdsQuery.data, dataInicio.toISOString()],
    queryFn: async () => {
      if (!agendamentosIdsQuery.data || agendamentosIdsQuery.data.length === 0) return [];

      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .in('agendamento_id', agendamentosIdsQuery.data)
        .eq('status', 'pago')
        .gte('data_pagamento', dataInicio.toISOString())
        .lte('data_pagamento', dataFim.toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!agendamentosIdsQuery.data && agendamentosIdsQuery.data.length > 0,
  });

  // Buscar despesas avulsas - buscar todas que possam ter parcelas no período
  // Para isso, buscamos despesas que iniciaram até 12 meses antes (máximo de parcelas possíveis)
  const despesasAvulsasQuery = useQuery({
    queryKey: ['fluxo-caixa-despesas', clinica?.id, dataInicio.toISOString(), dataFim.toISOString()],
    queryFn: async () => {
      if (!clinica?.id) return [];

      // Buscar despesas que possam ter parcelas no período
      // Uma despesa pode ter até 12 parcelas, então buscamos 12 meses antes do início
      const dataInicioExtendida = subMonths(dataInicio, 12);

      const { data, error } = await supabase
        .from('despesas_avulsas')
        .select('*')
        .eq('clinica_id', clinica.id)
        .gte('data_pagamento', dataInicioExtendida.toISOString())
        .lte('data_pagamento', dataFim.toISOString());

      if (error) throw error;
      return data as DespesaAvulsa[];
    },
    enabled: !!clinica?.id,
  });

  // Buscar atendimentos realizados para calcular custos variáveis
  const atendimentosQuery = useQuery({
    queryKey: ['fluxo-caixa-atendimentos', profissionaisQuery.data, dataInicio.toISOString()],
    queryFn: async () => {
      if (!profissionaisQuery.data || profissionaisQuery.data.length === 0) return [];

      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .in('profissional_id', profissionaisQuery.data)
        .eq('status', 'realizado')
        .gte('data_inicio', dataInicio.toISOString())
        .lte('data_inicio', dataFim.toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!profissionaisQuery.data && profissionaisQuery.data.length > 0,
  });

  // Calcular custos fixos e variáveis
  const custoFixoMensal = custos
    .filter(c => c.tipo === 'fixo' && c.frequencia === 'mensal')
    .reduce((sum, c) => sum + Number(c.valor_estimado), 0);

  const custoVariavelPorAtendimento = custos
    .filter(c => c.tipo === 'variavel' && c.frequencia === 'por_atendimento')
    .reduce((sum, c) => sum + Number(c.valor_estimado), 0);

  // Taxas de cartão da clínica
  const taxaCredito = Number(clinica?.taxa_cartao_credito) || 0;
  const taxaDebito = Number(clinica?.taxa_cartao_debito) || 0;

  // Gerar fluxo por mês
  const meses = eachMonthOfInterval({ start: dataInicio, end: dataFim });
  
  // Processar pagamentos parcelados - distribuir receita e taxas pelos meses
  const receitasBrutasPorMes: Record<string, number> = {};
  const taxasCartaoPorMes: Record<string, number> = {};
  
  (receitasQuery.data || []).forEach(p => {
    if (!p.data_pagamento) return;
    
    const parcelasTotais = p.parcelas_totais || 1;
    const valorParcela = (Number(p.valor_pago) || 0) / parcelasTotais;
    const dataPagamento = new Date(p.data_pagamento);
    const formaPagamento = p.forma_pagamento;
    
    // Calcular taxa de cartão
    let taxaPercentual = 0;
    if (formaPagamento === 'cartao_credito') {
      taxaPercentual = taxaCredito;
    } else if (formaPagamento === 'cartao_debito') {
      taxaPercentual = taxaDebito;
    }
    const taxaParcela = (valorParcela * taxaPercentual) / 100;
    
    // Distribuir o valor pelas parcelas
    for (let i = 0; i < parcelasTotais; i++) {
      const mesParcela = addMonths(dataPagamento, i);
      const mesKey = format(mesParcela, 'yyyy-MM');
      receitasBrutasPorMes[mesKey] = (receitasBrutasPorMes[mesKey] || 0) + valorParcela;
      taxasCartaoPorMes[mesKey] = (taxasCartaoPorMes[mesKey] || 0) + taxaParcela;
    }
  });
  
  const fluxoMensal: FluxoMensal[] = meses.map(mes => {
    const mesKey = format(mes, 'yyyy-MM');
    const mesFormatado = format(mes, 'MMM/yy', { locale: ptBR });
    
    // Receita bruta do mês
    const receitaBrutaMes = receitasBrutasPorMes[mesKey] || 0;
    // Taxas de cartão do mês
    const taxasCartaoMes = taxasCartaoPorMes[mesKey] || 0;
    // Receita líquida (descontando taxas de cartão)
    const receitaLiquidaMes = receitaBrutaMes - taxasCartaoMes;

    // Atendimentos do mês
    const atendimentosMes = (atendimentosQuery.data || [])
      .filter(a => format(new Date(a.data_inicio), 'yyyy-MM') === mesKey)
      .length;

    // Despesas avulsas do mês (agora distribuídas por parcelas)
    const despesasAvulsasMes = (despesasAvulsasQuery.data || [])
      .reduce((sum, d) => {
        const parcelas = d.parcelas || 1;
        const valorParcela = Number(d.valor) / parcelas;
        const dataPagamento = new Date(d.data_pagamento);
        
        // Verificar se alguma parcela cai neste mês
        let valorNoMes = 0;
        for (let i = 0; i < parcelas; i++) {
          const mesParcela = addMonths(dataPagamento, i);
          if (format(mesParcela, 'yyyy-MM') === mesKey) {
            valorNoMes += valorParcela;
          }
        }
        return sum + valorNoMes;
      }, 0);

    // Custo variável total (baseado em atendimentos)
    const despesasVariaveisMes = atendimentosMes * custoVariavelPorAtendimento;

    // Taxas de cartão entram como despesa variável adicional
    const totalDespesas = custoFixoMensal + despesasVariaveisMes + despesasAvulsasMes + taxasCartaoMes;
    const saldo = receitaBrutaMes - totalDespesas;

    return {
      mes: mesKey,
      mesFormatado,
      receitas: receitaLiquidaMes,
      receitaBruta: receitaBrutaMes,
      taxasCartao: taxasCartaoMes,
      despesasFixas: custoFixoMensal,
      despesasVariaveis: despesasVariaveisMes + taxasCartaoMes,
      despesasAvulsas: despesasAvulsasMes,
      totalDespesas,
      saldo,
      atendimentosRealizados: atendimentosMes,
    };
  });

  // Totais
  const totalReceitasBrutas = fluxoMensal.reduce((sum, m) => sum + m.receitaBruta, 0);
  const totalTaxasCartao = fluxoMensal.reduce((sum, m) => sum + m.taxasCartao, 0);
  const totalReceitas = fluxoMensal.reduce((sum, m) => sum + m.receitas, 0);
  const totalDespesas = fluxoMensal.reduce((sum, m) => sum + m.totalDespesas, 0);
  const saldoTotal = totalReceitasBrutas - totalDespesas;
  const mediaReceitaMensal = totalReceitas / meses.length;
  const mediaDespesaMensal = totalDespesas / meses.length;

  return {
    isLoading: profissionaisQuery.isLoading || agendamentosIdsQuery.isLoading || receitasQuery.isLoading || despesasAvulsasQuery.isLoading || atendimentosQuery.isLoading,
    fluxoMensal,
    totalReceitas,
    totalReceitasBrutas,
    totalTaxasCartao,
    totalDespesas,
    saldoTotal,
    mediaReceitaMensal,
    mediaDespesaMensal,
    custoFixoMensal,
    custoVariavelPorAtendimento,
    taxaCredito,
    taxaDebito,
  };
}
