import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from './useClinica';
import { useCustos } from './useCustos';
import { useCustosPagamentosRange } from './useCustosPagamentos';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, format, eachMonthOfInterval, subMonths, addMonths, isBefore, isAfter, isSameMonth } from 'date-fns';
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
  receitaPrevista: number; // Parcelas futuras certas a receber
  taxasCartao: number;
  taxasPrevistas: number; // Taxas das parcelas futuras
  despesasFixas: number;
  despesasFixasReal: number; // Valor real confirmado
  despesasFixasEstimado: number; // Valor estimado
  isEstimado: boolean; // Se usa estimativa ou valor real
  isFuturo: boolean; // Se é mês futuro (previsão)
  despesasVariaveis: number;
  despesasAvulsas: number;
  totalDespesas: number;
  saldo: number;
  saldoPrevisto: number; // Saldo considerando receitas previstas
  atendimentosRealizados: number;
  impostoEstimado: number; // Imposto estimado baseado na taxa_imposto da clínica
  saldoFinal: number; // Saldo após impostos
  saldoFinalPrevisto: number; // Saldo previsto após impostos
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

export function useFluxoCaixa(mesesAtras: number = 6, mesesFuturos: number = 3) {
  const { data: clinica } = useClinica();
  const { custos } = useCustos();
  const { pagamentos: pagamentosCustosRange, pagamentosPorMes } = useCustosPagamentosRange(mesesAtras);

  // Calcular período (inclui meses futuros para previsão)
  const hoje = new Date();
  const dataInicio = startOfMonth(subMonths(hoje, mesesAtras - 1));
  const dataFimPassado = endOfMonth(hoje);
  const dataFimFuturo = endOfMonth(addMonths(hoje, mesesFuturos));

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
        .lte('data_pagamento', dataFimPassado.toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!agendamentosIdsQuery.data && agendamentosIdsQuery.data.length > 0,
  });

  // Buscar pagamentos parcelados para previsão de receitas futuras
  const parcelasFuturasQuery = useQuery({
    queryKey: ['fluxo-caixa-parcelas-futuras', agendamentosIdsQuery.data],
    queryFn: async () => {
      if (!agendamentosIdsQuery.data || agendamentosIdsQuery.data.length === 0) return [];

      // Buscar todos os pagamentos parcelados (status pago = primeira parcela foi paga)
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .in('agendamento_id', agendamentosIdsQuery.data)
        .eq('status', 'pago')
        .eq('parcelado', true)
        .gt('parcelas_totais', 1)
        .not('data_pagamento', 'is', null);

      if (error) throw error;
      return data || [];
    },
    enabled: !!agendamentosIdsQuery.data && agendamentosIdsQuery.data.length > 0,
  });

  // Buscar despesas avulsas - buscar todas que possam ter parcelas no período
  // Para isso, buscamos despesas que iniciaram até 12 meses antes (máximo de parcelas possíveis)
  const despesasAvulsasQuery = useQuery({
    queryKey: ['fluxo-caixa-despesas', clinica?.id, dataInicio.toISOString(), dataFimFuturo.toISOString()],
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
        .lte('data_pagamento', dataFimFuturo.toISOString());

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
        .lte('data_inicio', dataFimPassado.toISOString());

      if (error) throw error;
      return data || [];
    },
    enabled: !!profissionaisQuery.data && profissionaisQuery.data.length > 0,
  });

  // Calcular custos fixos estimados e variáveis
  const custosFixosMensais = custos.filter(c => c.tipo === 'fixo' && c.frequencia === 'mensal');
  const custoFixoEstimado = custosFixosMensais.reduce((sum, c) => sum + Number(c.valor_estimado), 0);

  const custoVariavelMensal = custos
    .filter(c => c.tipo === 'variavel' && c.frequencia === 'mensal')
    .reduce((sum, c) => sum + Number(c.valor_estimado), 0);

  // Custos recorrentes mensais (fixos + variáveis mensais)
  const custosRecorrentesMensais = custos.filter(c => c.frequencia === 'mensal' && c.ativo);
  const custoRecorrenteEstimado = custosRecorrentesMensais.reduce((sum, c) => sum + Number(c.valor_estimado), 0);

  // Taxas de cartão da clínica
  const taxaCredito = Number(clinica?.taxa_cartao_credito) || 0;
  const taxaDebito = Number(clinica?.taxa_cartao_debito) || 0;

  // Gerar fluxo por mês (inclui meses futuros)
  const meses = eachMonthOfInterval({ start: dataInicio, end: dataFimFuturo });
  
  // Processar pagamentos parcelados - distribuir receita e taxas pelos meses
  const receitasBrutasPorMes: Record<string, number> = {};
  const receitasPrevistasPorMes: Record<string, number> = {}; // Parcelas futuras confirmadas
  const taxasCartaoPorMes: Record<string, number> = {};
  const taxasPrevistasPorMes: Record<string, number> = {};
  
  // Processar receitas já pagas
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
    
    // Distribuir o valor pelas parcelas já recebidas
    const parcelasRecebidas = p.parcelas_recebidas || parcelasTotais;
    for (let i = 0; i < parcelasRecebidas; i++) {
      const mesParcela = addMonths(dataPagamento, i);
      const mesKey = format(mesParcela, 'yyyy-MM');
      receitasBrutasPorMes[mesKey] = (receitasBrutasPorMes[mesKey] || 0) + valorParcela;
      taxasCartaoPorMes[mesKey] = (taxasCartaoPorMes[mesKey] || 0) + taxaParcela;
    }
  });

  // Processar parcelas futuras (receitas certas a receber)
  // A lógica: parcela 0 = mês do pagamento, parcela 1 = mês seguinte, etc.
  // parcelas_recebidas indica quantas já foram creditadas (começando em 1 para a primeira)
  (parcelasFuturasQuery.data || []).forEach(p => {
    if (!p.data_pagamento) return;
    
    const parcelasTotais = p.parcelas_totais || 1;
    // Se parcelas_recebidas é null, assumimos que só a primeira foi recebida
    const parcelasRecebidas = p.parcelas_recebidas ?? 1;
    const valorParcela = (Number(p.valor_total) || 0) / parcelasTotais;
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
    
    // Distribuir parcelas ainda não recebidas (futuras)
    // i começa em parcelasRecebidas (ex: se 1 foi recebida, começa em 1 = segunda parcela)
    for (let i = parcelasRecebidas; i < parcelasTotais; i++) {
      const mesParcela = addMonths(dataPagamento, i);
      const mesKey = format(mesParcela, 'yyyy-MM');
      
      // Só adicionar se for mês atual ou futuro
      if (isAfter(mesParcela, startOfMonth(hoje)) || isSameMonth(mesParcela, hoje)) {
        receitasPrevistasPorMes[mesKey] = (receitasPrevistasPorMes[mesKey] || 0) + valorParcela;
        taxasPrevistasPorMes[mesKey] = (taxasPrevistasPorMes[mesKey] || 0) + taxaParcela;
      }
    }
  });
  
  const fluxoMensal: FluxoMensal[] = meses.map(mes => {
    const mesKey = format(mes, 'yyyy-MM');
    const mesFormatado = format(mes, 'MMM/yy', { locale: ptBR });
    const mesAtualCalendario = isSameMonth(mes, hoje);
    const mesFuturo = isAfter(startOfMonth(mes), endOfMonth(hoje));
    const mesPassado = isBefore(endOfMonth(mes), startOfMonth(hoje));
    
    // Receita bruta do mês (já recebida)
    const receitaBrutaMes = receitasBrutasPorMes[mesKey] || 0;
    // Receita prevista (parcelas futuras certas)
    const receitaPrevistaMes = receitasPrevistasPorMes[mesKey] || 0;
    // Taxas de cartão do mês
    const taxasCartaoMes = taxasCartaoPorMes[mesKey] || 0;
    const taxasPrevistasMes = taxasPrevistasPorMes[mesKey] || 0;
    // Receita líquida (descontando taxas de cartão)
    const receitaLiquidaMes = receitaBrutaMes - taxasCartaoMes;

    // Atendimentos do mês (só para meses passados/atual)
    const atendimentosMes = mesFuturo ? 0 : (atendimentosQuery.data || [])
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

    // Custo variável total mensal
    const despesasVariaveisMes = custoVariavelMensal;

    // ============= LÓGICA DE CUSTOS: REAL vs ESTIMADO =============
    // Buscar pagamentos confirmados para este mês
    const pagamentosDoMes = pagamentosPorMes[mesKey] || [];
    
    // Calcular valor real pago (pagamentos confirmados)
    let despesasFixasReal = 0;
    const custosConfirmados = new Set<string>();
    
    pagamentosDoMes.forEach(pag => {
      if (pag.status === 'pago') {
        despesasFixasReal += Number(pag.valor_pago);
        custosConfirmados.add(pag.custo_id);
      }
    });
    
    // Calcular estimativa para custos não confirmados (usando custos recorrentes)
    let despesasFixasEstimado = 0;
    custosRecorrentesMensais.forEach(custo => {
      if (!custosConfirmados.has(custo.id)) {
        despesasFixasEstimado += Number(custo.valor_estimado);
      }
    });
    
    // Determinar se este mês usa valores estimados
    const isEstimado = mesFuturo || (mesAtualCalendario && despesasFixasEstimado > 0) || (!mesPassado && custosConfirmados.size < custosRecorrentesMensais.length);
    
    // Valor total de despesas fixas (real + estimado para não confirmados)
    const despesasFixas = despesasFixasReal + despesasFixasEstimado;

    // Total de despesas
    const totalDespesas = despesasFixas + despesasVariaveisMes + despesasAvulsasMes + taxasCartaoMes;
    
    // Saldo realizado
    const saldo = receitaBrutaMes - totalDespesas;
    
    // Saldo previsto (inclui receitas certas a receber - taxas previstas)
    const despesasPrevistas = mesFuturo ? (despesasFixas + despesasAvulsasMes + taxasPrevistasMes) : totalDespesas;
    const receitaTotalPrevista = receitaBrutaMes + receitaPrevistaMes;
    const saldoPrevisto = receitaTotalPrevista - despesasPrevistas;

    // Calcular imposto estimado baseado na taxa_imposto da clínica
    const taxaImposto = Number(clinica?.taxa_imposto) || 0;
    const receitaParaImposto = mesFuturo ? receitaPrevistaMes : receitaBrutaMes;
    const impostoEstimado = (receitaParaImposto * taxaImposto) / 100;
    
    // Saldo final após impostos
    const saldoFinal = saldo - impostoEstimado;
    const saldoFinalPrevisto = saldoPrevisto - impostoEstimado;

    return {
      mes: mesKey,
      mesFormatado,
      receitas: receitaLiquidaMes,
      receitaBruta: receitaBrutaMes,
      receitaPrevista: receitaPrevistaMes,
      taxasCartao: taxasCartaoMes,
      taxasPrevistas: taxasPrevistasMes,
      despesasFixas,
      despesasFixasReal,
      despesasFixasEstimado,
      isEstimado,
      isFuturo: mesFuturo,
      despesasVariaveis: despesasVariaveisMes + taxasCartaoMes,
      despesasAvulsas: despesasAvulsasMes,
      totalDespesas,
      saldo,
      saldoPrevisto,
      atendimentosRealizados: atendimentosMes,
      impostoEstimado,
      saldoFinal,
      saldoFinalPrevisto,
    };
  });

  // Totais (separando passado de futuro)
  const fluxoPassado = fluxoMensal.filter(m => !m.isFuturo);
  const fluxoFuturo = fluxoMensal.filter(m => m.isFuturo);
  
  const totalReceitasBrutas = fluxoPassado.reduce((sum, m) => sum + m.receitaBruta, 0);
  const totalReceitasPrevistas = fluxoFuturo.reduce((sum, m) => sum + m.receitaPrevista, 0);
  const totalTaxasCartao = fluxoPassado.reduce((sum, m) => sum + m.taxasCartao, 0);
  const totalReceitas = fluxoPassado.reduce((sum, m) => sum + m.receitas, 0);
  const totalDespesas = fluxoPassado.reduce((sum, m) => sum + m.totalDespesas, 0);
  const totalDespesasPrevistas = fluxoFuturo.reduce((sum, m) => sum + m.totalDespesas, 0);
  const totalImpostos = fluxoPassado.reduce((sum, m) => sum + m.impostoEstimado, 0);
  const saldoTotal = totalReceitasBrutas - totalDespesas;
  const saldoFinalTotal = fluxoPassado.reduce((sum, m) => sum + m.saldoFinal, 0);
  const mediaReceitaMensal = fluxoPassado.length > 0 ? totalReceitas / fluxoPassado.length : 0;
  const mediaDespesaMensal = fluxoPassado.length > 0 ? totalDespesas / fluxoPassado.length : 0;
  const mediaSaldoMensal = fluxoPassado.length > 0 ? saldoFinalTotal / fluxoPassado.length : 0;

  // Calcular crescimento de receita em relação ao mês passado
  const mesAtual = fluxoPassado[fluxoPassado.length - 1];
  const mesAnterior = fluxoPassado.length >= 2 ? fluxoPassado[fluxoPassado.length - 2] : null;
  
  let crescimentoReceita = 0;
  if (mesAnterior && mesAnterior.receitaBruta > 0) {
    crescimentoReceita = ((mesAtual?.receitaBruta || 0) - mesAnterior.receitaBruta) / mesAnterior.receitaBruta * 100;
  }

  return {
    isLoading: profissionaisQuery.isLoading || agendamentosIdsQuery.isLoading || receitasQuery.isLoading || despesasAvulsasQuery.isLoading || atendimentosQuery.isLoading || parcelasFuturasQuery.isLoading,
    fluxoMensal,
    totalReceitas,
    totalReceitasBrutas,
    totalReceitasPrevistas,
    totalTaxasCartao,
    totalDespesas,
    totalDespesasPrevistas,
    totalImpostos,
    saldoTotal,
    saldoFinalTotal,
    mediaReceitaMensal,
    mediaDespesaMensal,
    mediaSaldoMensal,
    crescimentoReceita,
    custoFixoMensal: custoRecorrenteEstimado,
    custoVariavelMensal,
    taxaCredito,
    taxaDebito,
  };
}
