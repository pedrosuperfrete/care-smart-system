import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from './useClinica';
import { useCustos, useRentabilidade } from './useCustos';

export interface ServicoMix {
  id: string;
  nome: string;
  preco: number;
  volumeMensal: number;
  percentualMix: number;
  custoVariavel: number;
  taxaCartao: number;
  custoFixoAlocado: number;
  lucroLiquido: number;
  lucroTotalMensal: number;
}

export interface DistribuicaoServicos {
  nome: string;
  atendimentosNecessarios: number;
  percentualMix: number;
  lucroUnitario: number;
  contribuicaoLucro: number;
  faturamentoParcial: number;
}

export interface ResultadoSimulacao {
  // Equilíbrio (break-even)
  equilibrio: {
    totalAtendimentosNecessarios: number;
    faturamentoBrutoNecessario: number;
    servicosMix: DistribuicaoServicos[];
  };
  
  // Meta
  meta: {
    metaLiquida: number;
    faturamentoBrutoNecessario: number;
    receitaLiquidaEstimada: number;
    receitaLiquidaAposImpostos: number;
    totalAtendimentosNecessarios: number;
    servicosMix: DistribuicaoServicos[];
  };
  
  // Cenário atual
  cenarioAtual: {
    atendimentosMensais: number;
    faturamentoMensal: number;
    lucroAntesImpostos: number;
    impostoEstimado: number;
    lucroLiquido: number; // Após impostos
  };
  
  // Saldo acumulado (histórico de meses)
  saldoAcumulado: {
    meses: Array<{
      mes: string;
      lucroReal: number;
      metaMes: number;
      diferenca: number;
    }>;
    saldoTotal: number;
    mesesRestantes: number;
    metaMensalAjustada: number;
  };
  
  // Custos
  custoFixoTotal: number;
  margemPonderada: number;
  taxaImposto: number;
  
  // Insights
  insights: string[];
  
  // Flags
  metaViavel: boolean;
  alertas: string[];
}

// Fator máximo de crescimento permitido para serviços com baixo volume histórico
const FATOR_CRESCIMENTO_MAX = 1.3; // 30% de aumento máximo

export function useSimuladorMeta(metaLiquidaDesejada: number) {
  const { data: clinica } = useClinica();
  const { custos } = useCustos();
  const rentabilidade = useRentabilidade();

  // Buscar agendamentos realizados dos últimos 6 meses para calcular mix histórico e saldo
  // Primeiro buscar profissionais da clínica para filtrar agendamentos
  const profissionaisQuery = useQuery({
    queryKey: ['profissionais-clinica', clinica?.id],
    queryFn: async () => {
      if (!clinica?.id) return [];
      
      const { data, error } = await supabase
        .from('profissionais')
        .select('id')
        .eq('clinica_id', clinica.id)
        .eq('ativo', true);
      
      if (error) throw error;
      return data?.map(p => p.id) || [];
    },
    enabled: !!clinica?.id,
  });

  const agendamentosQuery = useQuery({
    queryKey: ['simulador-historico', clinica?.id, profissionaisQuery.data],
    queryFn: async () => {
      if (!clinica?.id || !profissionaisQuery.data?.length) return [];

      const seisMesesAtras = new Date();
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          tipo_servico,
          data_inicio,
          status,
          valor,
          profissional_id,
          pagamentos!fk_pagamento_agendamento(forma_pagamento, valor_pago, status)
        `)
        .in('profissional_id', profissionaisQuery.data)
        .gte('data_inicio', seisMesesAtras.toISOString())
        .eq('status', 'realizado');

      if (error) throw error;
      return data || [];
    },
    enabled: !!clinica?.id && !!profissionaisQuery.data?.length,
  });

  // Calcular proporção de pagamentos em cartão (com taxa) vs outros meios
  const proporcaoCartao = useMemo(() => {
    const agendamentos = agendamentosQuery.data || [];
    
    let totalPagamentos = 0;
    let pagamentosCartaoCredito = 0;
    let pagamentosCartaoDebito = 0;
    
    agendamentos.forEach(ag => {
      const pagamentos = (ag as any).pagamentos || [];
      pagamentos.forEach((pag: any) => {
        if (pag.status === 'pago') {
          const valor = Number(pag.valor_pago) || 0;
          totalPagamentos += valor;
          
          if (pag.forma_pagamento === 'cartao_credito' || pag.forma_pagamento === 'cartao') {
            pagamentosCartaoCredito += valor;
          } else if (pag.forma_pagamento === 'cartao_debito') {
            pagamentosCartaoDebito += valor;
          }
        }
      });
    });
    
    if (totalPagamentos === 0) {
      // Se não tem histórico de pagamentos, assume proporção conservadora
      return { percentualCredito: 0.3, percentualDebito: 0.1 };
    }
    
    return {
      percentualCredito: pagamentosCartaoCredito / totalPagamentos,
      percentualDebito: pagamentosCartaoDebito / totalPagamentos,
    };
  }, [agendamentosQuery.data]);

  // Taxa de cartão ponderada pela proporção real de uso
  const taxaCartaoPonderada = useMemo(() => {
    if (!clinica) return 0;
    const taxaCredito = Number(clinica.taxa_cartao_credito) || 0;
    const taxaDebito = Number(clinica.taxa_cartao_debito) || 0;
    
    // Aplicar taxa apenas na proporção de pagamentos em cartão
    const taxaCreditoPonderada = (taxaCredito / 100) * proporcaoCartao.percentualCredito;
    const taxaDebitoPonderada = (taxaDebito / 100) * proporcaoCartao.percentualDebito;
    
    return taxaCreditoPonderada + taxaDebitoPonderada;
  }, [clinica, proporcaoCartao]);

  // Calcular mix histórico por serviço (usando últimos 3 meses)
  const mixHistorico = useMemo(() => {
    const agendamentos = agendamentosQuery.data || [];
    if (agendamentos.length === 0) return [];

    const tresMesesAtras = new Date();
    tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
    
    const agendamentosRecentes = agendamentos.filter(
      ag => new Date(ag.data_inicio) >= tresMesesAtras
    );

    const meses = 3;
    const contagem: Record<string, { quantidade: number; valorTotal: number }> = {};
    
    agendamentosRecentes.forEach(ag => {
      if (!ag.tipo_servico) return;
      if (!contagem[ag.tipo_servico]) {
        contagem[ag.tipo_servico] = { quantidade: 0, valorTotal: 0 };
      }
      contagem[ag.tipo_servico].quantidade++;
      contagem[ag.tipo_servico].valorTotal += Number(ag.valor) || 0;
    });

    const totalGeral = Object.values(contagem).reduce((sum, c) => sum + c.quantidade, 0);
    
    return Object.entries(contagem).map(([servico, dados]) => ({
      nome: servico,
      volumeMensal: dados.quantidade / meses,
      percentualMix: totalGeral > 0 ? (dados.quantidade / totalGeral) * 100 : 0,
      ticketMedio: dados.quantidade > 0 ? dados.valorTotal / dados.quantidade : 0,
    }));
  }, [agendamentosQuery.data]);

  // Calcular histórico de lucro por mês (para saldo acumulado)
  const historicoMensal = useMemo(() => {
    const agendamentos = agendamentosQuery.data || [];
    if (agendamentos.length === 0) return [];

    const custoFixoTotal = rentabilidade.custoFixoTotal;
    
    // Agrupar por mês
    const porMes: Record<string, { faturamento: number; count: number }> = {};
    
    agendamentos.forEach(ag => {
      const data = new Date(ag.data_inicio);
      const mesKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      if (!porMes[mesKey]) {
        porMes[mesKey] = { faturamento: 0, count: 0 };
      }
      porMes[mesKey].faturamento += Number(ag.valor) || 0;
      porMes[mesKey].count++;
    });

    // Calcular lucro aproximado por mês
    // Usando margem média estimada de 60% (antes de custos fixos)
    const margemMediaEstimada = 0.60;
    
    return Object.entries(porMes)
      .map(([mes, dados]) => ({
        mes,
        faturamento: dados.faturamento,
        lucroEstimado: (dados.faturamento * margemMediaEstimada) - custoFixoTotal,
        atendimentos: dados.count,
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }, [agendamentosQuery.data, rentabilidade.custoFixoTotal]);

  // Função para calcular distribuição de serviços dado um volume total
  const calcularDistribuicao = (
    servicosComMargem: ServicoMix[],
    volumeTotal: number,
    alertas: string[]
  ): DistribuicaoServicos[] => {
    return servicosComMargem.map(servico => {
      let atendimentosNecessarios = Math.ceil(volumeTotal * servico.percentualMix / 100);
      
      // Aplicar limite de crescimento para serviços com baixo volume histórico
      if (servico.percentualMix < 5 && servico.volumeMensal > 0) {
        const limiteMax = Math.ceil(servico.volumeMensal * FATOR_CRESCIMENTO_MAX);
        if (atendimentosNecessarios > limiteMax) {
          alertas.push(`"${servico.nome}" limitado a ${limiteMax} atendimentos (máx +30% do histórico).`);
          atendimentosNecessarios = limiteMax;
        }
      }
      
      // Não permitir recomendações irreais (0 histórico → máximo 2)
      if (servico.volumeMensal === 0 && atendimentosNecessarios > 2) {
        atendimentosNecessarios = 2;
        alertas.push(`"${servico.nome}" sem histórico - limitado a 2 atendimentos.`);
      }

      return {
        nome: servico.nome,
        atendimentosNecessarios,
        percentualMix: servico.percentualMix,
        lucroUnitario: servico.lucroLiquido,
        contribuicaoLucro: atendimentosNecessarios * servico.lucroLiquido,
        faturamentoParcial: atendimentosNecessarios * servico.preco,
      };
    }).filter(s => s.atendimentosNecessarios > 0).sort((a, b) => b.atendimentosNecessarios - a.atendimentosNecessarios);
  };

  // Calcular resultado da simulação
  const resultado = useMemo((): ResultadoSimulacao | null => {
    if (!rentabilidade.servicos || rentabilidade.servicos.length === 0) {
      return null;
    }
    
    if (mixHistorico.length === 0) {
      return null;
    }

    const custoFixoTotal = rentabilidade.custoFixoTotal;
    const insights: string[] = [];
    const alertas: string[] = [];

    // 1. Montar dados de cada serviço com margem real
    const servicosComMargem: ServicoMix[] = [];
    
    mixHistorico.forEach(mix => {
      const servicoRent = rentabilidade.rentabilidadePorServico.find(s => s.nome === mix.nome);
      
      // Se não encontrar no cadastro, usar ticket médio histórico do próprio agendamento
      const preco = servicoRent?.preco ?? mix.ticketMedio;
      const custoVariavel = servicoRent?.custoVariavel ?? 0;
      const taxaCartao = preco * taxaCartaoPonderada;
      
      // Usar o custo fixo proporcional calculado pelo useRentabilidade ou ratear igualmente
      const custoFixoPorAtendimento = servicoRent?.custoFixoProporcional ?? 
        (custoFixoTotal / Math.max(mixHistorico.reduce((sum, m) => sum + m.volumeMensal, 0), 1));
      
      // Margem de contribuição = preço - custos variáveis - taxa cartão - custo fixo alocado
      // Esta é a margem real por atendimento após todos os custos
      const lucroLiquidoUnitario = preco - custoVariavel - taxaCartao - custoFixoPorAtendimento;
      
      // Pular serviços sem nome ou sem preço
      if (!mix.nome || preco <= 0) return;
      
      servicosComMargem.push({
        id: servicoRent?.id ?? mix.nome,
        nome: mix.nome,
        preco,
        volumeMensal: mix.volumeMensal,
        percentualMix: mix.percentualMix,
        custoVariavel,
        taxaCartao,
        custoFixoAlocado: custoFixoPorAtendimento,
        lucroLiquido: lucroLiquidoUnitario, // Lucro líquido real por atendimento
        lucroTotalMensal: lucroLiquidoUnitario * mix.volumeMensal,
      });
    });

    if (servicosComMargem.length === 0) {
      return null;
    }

    // 2. Calcular margem média ponderada pelo mix histórico
    const margemPonderada = servicosComMargem.reduce(
      (sum, s) => sum + (s.lucroLiquido * s.percentualMix / 100),
      0
    );

    if (margemPonderada <= 0) {
      alertas.push('⚠️ Sua margem média ponderada está negativa. Revise seus preços e custos.');
      return {
        equilibrio: {
          totalAtendimentosNecessarios: Infinity,
          faturamentoBrutoNecessario: 0,
          servicosMix: [],
        },
        meta: {
          metaLiquida: metaLiquidaDesejada,
          faturamentoBrutoNecessario: 0,
          receitaLiquidaEstimada: 0,
          receitaLiquidaAposImpostos: 0,
          totalAtendimentosNecessarios: Infinity,
          servicosMix: [],
        },
        cenarioAtual: {
          atendimentosMensais: servicosComMargem.reduce((sum, s) => sum + s.volumeMensal, 0),
          faturamentoMensal: servicosComMargem.reduce((sum, s) => sum + (s.preco * s.volumeMensal), 0),
          lucroAntesImpostos: servicosComMargem.reduce((sum, s) => sum + s.lucroTotalMensal, 0),
          impostoEstimado: 0,
          lucroLiquido: servicosComMargem.reduce((sum, s) => sum + s.lucroTotalMensal, 0),
        },
        saldoAcumulado: { meses: [], saldoTotal: 0, mesesRestantes: 0, metaMensalAjustada: metaLiquidaDesejada },
        custoFixoTotal,
        margemPonderada,
        taxaImposto: 0,
        insights: [],
        metaViavel: false,
        alertas,
      };
    }

    // 3. EQUILÍBRIO: Agora lucroLiquido já inclui custos fixos rateados, então
    // equilíbrio é quando lucroLiquido * volume = 0. Como lucro já tem custos fixos
    // embutidos por atendimento, precisamos encontrar volume onde o lucro total = 0.
    // Mas como os custos já estão "diluídos" por atendimento, o volume de equilíbrio
    // é 1 atendimento = custoFixo/qtdServicos de custo. Precisamos recalcular:
    // Se lucroLiquido = preco - custoVar - taxaCartao - custoFixo/n, e queremos lucro total = 0
    // então precisamos de n atendimentos onde a soma dos lucros = 0
    // Isso só acontece se lucroLiquido >= 0. Se < 0, é Infinity.
    // Como o custo fixo já está rateado por serviço (não por atendimento), 
    // vamos calcular de forma diferente: volume onde receita cobre todos os custos
    
    // Para break-even: a margem de contribuição (preço - custoVar - taxaCartao) deve cobrir custoFixoTotal
    const margemContribuicaoPonderada = servicosComMargem.reduce(
      (sum, s) => sum + ((s.preco - s.custoVariavel - s.taxaCartao) * s.percentualMix / 100),
      0
    );
    
    const volumeEquilibrio = margemContribuicaoPonderada > 0 
      ? Math.ceil(custoFixoTotal / margemContribuicaoPonderada)
      : Infinity;
    const alertasEquilibrio: string[] = [];
    const servicosEquilibrio = isFinite(volumeEquilibrio) 
      ? calcularDistribuicao(servicosComMargem, volumeEquilibrio, alertasEquilibrio)
      : [];
    const faturamentoEquilibrio = servicosEquilibrio.reduce((sum, s) => sum + s.faturamentoParcial, 0);

    // 4. META: Volume para atingir meta de lucro líquido
    const volumeMeta = margemContribuicaoPonderada > 0
      ? Math.ceil((metaLiquidaDesejada + custoFixoTotal) / margemContribuicaoPonderada)
      : Infinity;
    const alertasMeta: string[] = [];
    const servicosMeta = calcularDistribuicao(servicosComMargem, volumeMeta, alertasMeta);
    
    // Combinar alertas
    alertas.push(...alertasMeta);

    // Recalcular totais reais da meta (após limites)
    // Nota: lucroUnitario já inclui custos fixos rateados
    const totalAtendimentosMeta = servicosMeta.reduce((sum, s) => sum + s.atendimentosNecessarios, 0);
    const faturamentoMeta = servicosMeta.reduce((sum, s) => sum + s.faturamentoParcial, 0);
    const receitaLiquidaMeta = servicosMeta.reduce((sum, s) => sum + s.contribuicaoLucro, 0);
    
    // Calcular imposto sobre o faturamento
    const taxaImposto = Number((clinica as any)?.taxa_imposto) || 0;
    const impostoMeta = (faturamentoMeta * taxaImposto) / 100;
    const receitaLiquidaAposImpostosMeta = receitaLiquidaMeta - impostoMeta;

    // 5. Cenário atual (lucroTotalMensal já tem custos fixos rateados embutidos)
    const atendimentosAtuais = servicosComMargem.reduce((sum, s) => sum + s.volumeMensal, 0);
    const lucroAntesImpostos = servicosComMargem.reduce((sum, s) => sum + s.lucroTotalMensal, 0);
    const faturamentoAtual = servicosComMargem.reduce((sum, s) => sum + (s.preco * s.volumeMensal), 0);
    const impostoAtual = (faturamentoAtual * taxaImposto) / 100;
    const lucroLiquidoAtual = lucroAntesImpostos - impostoAtual;

    // 6. Saldo acumulado - calcular diferença entre lucro real e meta por mês
    const agora = new Date();
    const mesAtual = agora.getMonth(); // 0-11
    const mesesDoAno = historicoMensal.filter(h => {
      const [ano] = h.mes.split('-').map(Number);
      return ano === agora.getFullYear();
    });

    const mesesComSaldo = mesesDoAno.map(m => ({
      mes: m.mes,
      lucroReal: m.lucroEstimado,
      metaMes: metaLiquidaDesejada,
      diferenca: m.lucroEstimado - metaLiquidaDesejada,
    }));

    const saldoTotal = mesesComSaldo.reduce((sum, m) => sum + m.diferenca, 0);
    const mesesRestantes = 12 - mesAtual - 1; // Meses que faltam no ano
    
    // Meta mensal ajustada para compensar déficit/superávit
    const metaMensalAjustada = mesesRestantes > 0 
      ? metaLiquidaDesejada - (saldoTotal / mesesRestantes)
      : metaLiquidaDesejada;

    // 7. Gerar insights
    // Insight sobre equilíbrio
    if (atendimentosAtuais >= volumeEquilibrio) {
      insights.push(`✅ Você já está acima do ponto de equilíbrio (${servicosEquilibrio.reduce((s, x) => s + x.atendimentosNecessarios, 0)} atendimentos).`);
    } else {
      const faltam = volumeEquilibrio - Math.round(atendimentosAtuais);
      insights.push(`⚠️ Faltam ${faltam} atendimentos para cobrir seus custos fixos.`);
    }

    if (receitaLiquidaMeta >= metaLiquidaDesejada * 0.95) {
      insights.push(`✅ Mantendo o padrão recomendado, você atingirá sua meta.`);
    } else if (receitaLiquidaMeta >= metaLiquidaDesejada * 0.8) {
      const faltam = Math.ceil((metaLiquidaDesejada - receitaLiquidaMeta) / margemPonderada);
      insights.push(`📈 Próximo da meta! +${faltam} atendimentos para chegar lá.`);
    }

    // Insight sobre saldo acumulado
    if (saldoTotal < 0 && mesesRestantes > 0) {
      insights.push(`📊 Você tem R$ ${Math.abs(saldoTotal).toFixed(0)} de déficit acumulado. Para compensar, a meta mensal passa a ser R$ ${metaMensalAjustada.toFixed(0)}.`);
    } else if (saldoTotal > 0) {
      insights.push(`🎉 Você tem R$ ${saldoTotal.toFixed(0)} de superávit acumulado no ano!`);
    }

    // Insight sobre procedimentos vs consultas
    const servicoMaiorMargem = servicosComMargem.reduce((a, b) => a.lucroLiquido > b.lucroLiquido ? a : b);
    const servicoMenorMargem = servicosComMargem.reduce((a, b) => a.lucroLiquido < b.lucroLiquido ? a : b);
    
    if (servicoMaiorMargem.nome !== servicoMenorMargem.nome) {
      const diferencaMargem = servicoMaiorMargem.lucroLiquido - servicoMenorMargem.lucroLiquido;
      const consultasMenorMargem = servicosMeta.find(s => s.nome === servicoMenorMargem.nome)?.atendimentosNecessarios || 0;
      
      if (diferencaMargem > 50 && consultasMenorMargem > 5) {
        const troca = Math.ceil(consultasMenorMargem * 0.1);
        const economiaMigrar = troca * diferencaMargem;
        insights.push(
          `💡 Migrar ${troca} de "${servicoMenorMargem.nome}" → "${servicoMaiorMargem.nome}" = +R$ ${economiaMigrar.toFixed(0)}/mês.`
        );
      }
    }

    // 8. Verificar viabilidade
    const metaViavel = receitaLiquidaMeta >= metaLiquidaDesejada * 0.9 && totalAtendimentosMeta < 500;

    return {
      equilibrio: {
        totalAtendimentosNecessarios: servicosEquilibrio.reduce((s, x) => s + x.atendimentosNecessarios, 0),
        faturamentoBrutoNecessario: faturamentoEquilibrio,
        servicosMix: servicosEquilibrio,
      },
      meta: {
        metaLiquida: metaLiquidaDesejada,
        faturamentoBrutoNecessario: faturamentoMeta,
        receitaLiquidaEstimada: receitaLiquidaMeta,
        receitaLiquidaAposImpostos: receitaLiquidaAposImpostosMeta,
        totalAtendimentosNecessarios: totalAtendimentosMeta,
        servicosMix: servicosMeta,
      },
      cenarioAtual: {
        atendimentosMensais: Math.round(atendimentosAtuais),
        faturamentoMensal: faturamentoAtual,
        lucroAntesImpostos,
        impostoEstimado: impostoAtual,
        lucroLiquido: lucroLiquidoAtual,
      },
      saldoAcumulado: {
        meses: mesesComSaldo,
        saldoTotal,
        mesesRestantes,
        metaMensalAjustada,
      },
      custoFixoTotal,
      margemPonderada,
      taxaImposto,
      insights,
      metaViavel,
      alertas,
    };
  }, [metaLiquidaDesejada, mixHistorico, rentabilidade, taxaCartaoPonderada, historicoMensal]);

  return {
    isLoading: profissionaisQuery.isLoading || agendamentosQuery.isLoading || rentabilidade.isLoading,
    error: (profissionaisQuery.error as Error | null) || (agendamentosQuery.error as Error | null) || null,
    resultado,
    temHistorico: mixHistorico.length > 0,
    mixHistorico,
    debug: {
      profissionaisCount: profissionaisQuery.data?.length ?? 0,
      agendamentosCount: agendamentosQuery.data?.length ?? 0,
    },
  };
}
