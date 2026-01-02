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

export interface ResultadoSimulacao {
  // Meta e resultado
  metaLiquida: number;
  faturamentoBrutoNecessario: number;
  receitaLiquidaEstimada: number;
  
  // Totais
  totalAtendimentosNecessarios: number;
  
  // Breakdown por serviço
  servicosMix: Array<{
    nome: string;
    atendimentosNecessarios: number;
    percentualMix: number;
    lucroUnitario: number;
    contribuicaoLucro: number;
    faturamentoParcial: number;
  }>;
  
  // Comparação com cenário atual
  cenarioAtual: {
    atendimentosMensais: number;
    lucroMensal: number;
    faturamentoMensal: number;
  };
  
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

  // Buscar agendamentos realizados dos últimos 3 meses para calcular mix histórico
  const agendamentosQuery = useQuery({
    queryKey: ['simulador-historico', clinica?.id],
    queryFn: async () => {
      if (!clinica?.id) return [];

      const tresMesesAtras = new Date();
      tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          id,
          tipo_servico,
          data_inicio,
          status,
          valor,
          profissionais!inner(clinica_id)
        `)
        .eq('profissionais.clinica_id', clinica.id)
        .gte('data_inicio', tresMesesAtras.toISOString())
        .eq('status', 'realizado');

      if (error) throw error;
      return data || [];
    },
    enabled: !!clinica?.id,
  });

  // Taxas de cartão da clínica (média se disponível)
  const taxaCartaoMedia = useMemo(() => {
    if (!clinica) return 0;
    const taxaCredito = Number(clinica.taxa_cartao_credito) || 0;
    const taxaDebito = Number(clinica.taxa_cartao_debito) || 0;
    // Assumir 70% crédito, 30% débito como média típica
    return (taxaCredito * 0.7 + taxaDebito * 0.3) / 100;
  }, [clinica]);

  // Calcular mix histórico por serviço
  const mixHistorico = useMemo(() => {
    const agendamentos = agendamentosQuery.data || [];
    if (agendamentos.length === 0) return [];

    const meses = 3; // Últimos 3 meses
    const contagem: Record<string, { quantidade: number; valorTotal: number }> = {};
    
    agendamentos.forEach(ag => {
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
      if (!servicoRent) return;

      const preco = servicoRent.preco;
      const custoVariavel = servicoRent.custoVariavel;
      const taxaCartao = preco * taxaCartaoMedia;
      
      // Alocar custo fixo proporcional ao mix
      const custoFixoAlocado = (custoFixoTotal * mix.percentualMix) / 100;
      
      // Lucro líquido por atendimento (sem custo fixo - será considerado no total)
      const lucroLiquidoUnitario = preco - custoVariavel - taxaCartao;
      
      servicosComMargem.push({
        id: servicoRent.id,
        nome: mix.nome,
        preco,
        volumeMensal: mix.volumeMensal,
        percentualMix: mix.percentualMix,
        custoVariavel,
        taxaCartao,
        custoFixoAlocado: custoFixoAlocado / Math.max(mix.volumeMensal, 1), // por atendimento
        lucroLiquido: lucroLiquidoUnitario,
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
        metaLiquida: metaLiquidaDesejada,
        faturamentoBrutoNecessario: 0,
        receitaLiquidaEstimada: 0,
        totalAtendimentosNecessarios: Infinity,
        servicosMix: [],
        cenarioAtual: {
          atendimentosMensais: servicosComMargem.reduce((sum, s) => sum + s.volumeMensal, 0),
          lucroMensal: servicosComMargem.reduce((sum, s) => sum + s.lucroTotalMensal, 0) - custoFixoTotal,
          faturamentoMensal: servicosComMargem.reduce((sum, s) => sum + (s.preco * s.volumeMensal), 0),
        },
        insights: [],
        metaViavel: false,
        alertas,
      };
    }

    // 3. Calcular volume total necessário
    // Fórmula: (meta_liquida + custos_fixos) / margem_ponderada
    const volumeTotalNecessario = Math.ceil((metaLiquidaDesejada + custoFixoTotal) / margemPonderada);

    // 4. Distribuir volume por serviço respeitando mix histórico
    const servicosMix = servicosComMargem.map(servico => {
      let atendimentosNecessarios = Math.ceil(volumeTotalNecessario * servico.percentualMix / 100);
      
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
    });

    // 5. Recalcular totais reais (após aplicar limites)
    const totalAtendimentosReais = servicosMix.reduce((sum, s) => sum + s.atendimentosNecessarios, 0);
    const faturamentoBrutoNecessario = servicosMix.reduce((sum, s) => sum + s.faturamentoParcial, 0);
    const lucroContribuicao = servicosMix.reduce((sum, s) => sum + s.contribuicaoLucro, 0);
    const receitaLiquidaEstimada = lucroContribuicao - custoFixoTotal;

    // 6. Cenário atual
    const atendimentosAtuais = servicosComMargem.reduce((sum, s) => sum + s.volumeMensal, 0);
    const lucroAtual = servicosComMargem.reduce((sum, s) => sum + s.lucroTotalMensal, 0) - custoFixoTotal;
    const faturamentoAtual = servicosComMargem.reduce((sum, s) => sum + (s.preco * s.volumeMensal), 0);

    // 7. Gerar insights
    if (receitaLiquidaEstimada >= metaLiquidaDesejada * 0.95) {
      insights.push(`✅ Mantendo seu padrão atual de atendimentos, você atingirá a meta.`);
    } else if (receitaLiquidaEstimada >= metaLiquidaDesejada * 0.8) {
      insights.push(`📈 Você está próximo da meta. Um pequeno aumento de ${Math.ceil((metaLiquidaDesejada - receitaLiquidaEstimada) / margemPonderada)} atendimentos basta.`);
    }

    // Insight sobre procedimentos vs consultas
    const servicoMaiorMargem = servicosComMargem.reduce((a, b) => a.lucroLiquido > b.lucroLiquido ? a : b);
    const servicoMenorMargem = servicosComMargem.reduce((a, b) => a.lucroLiquido < b.lucroLiquido ? a : b);
    
    if (servicoMaiorMargem.nome !== servicoMenorMargem.nome) {
      const diferencaMargem = servicoMaiorMargem.lucroLiquido - servicoMenorMargem.lucroLiquido;
      const consultasMenorMargem = servicosMix.find(s => s.nome === servicoMenorMargem.nome)?.atendimentosNecessarios || 0;
      
      if (diferencaMargem > 50 && consultasMenorMargem > 5) {
        const troca = Math.ceil(consultasMenorMargem * 0.1); // 10% de migração
        const economiaMigrar = troca * diferencaMargem;
        insights.push(
          `💡 Se migrar ${troca} atendimento(s) de "${servicoMenorMargem.nome}" para "${servicoMaiorMargem.nome}", você ganha +R$ ${economiaMigrar.toFixed(0)}/mês.`
        );
      }
    }

    // Procedimentos representam X% da renda
    const lucroTotalProcedimentos = servicosComMargem
      .filter(s => s.nome.toLowerCase().includes('fotona') || 
                   s.nome.toLowerCase().includes('clareamento') || 
                   s.nome.toLowerCase().includes('procedimento') ||
                   s.nome.toLowerCase().includes('laser'))
      .reduce((sum, s) => sum + s.lucroTotalMensal, 0);
    
    if (lucroTotalProcedimentos > 0 && lucroAtual > 0) {
      const percentualProcedimentos = (lucroTotalProcedimentos / (lucroAtual + custoFixoTotal)) * 100;
      if (percentualProcedimentos > 10) {
        insights.push(`💰 Procedimentos representam ${percentualProcedimentos.toFixed(0)}% da sua renda líquida.`);
      }
    }

    // 8. Verificar viabilidade
    const metaViavel = receitaLiquidaEstimada >= metaLiquidaDesejada * 0.9 && totalAtendimentosReais < 500;

    return {
      metaLiquida: metaLiquidaDesejada,
      faturamentoBrutoNecessario,
      receitaLiquidaEstimada,
      totalAtendimentosNecessarios: totalAtendimentosReais,
      servicosMix: servicosMix.filter(s => s.atendimentosNecessarios > 0).sort((a, b) => b.atendimentosNecessarios - a.atendimentosNecessarios),
      cenarioAtual: {
        atendimentosMensais: Math.round(atendimentosAtuais),
        lucroMensal: lucroAtual,
        faturamentoMensal: faturamentoAtual,
      },
      insights,
      metaViavel,
      alertas,
    };
  }, [metaLiquidaDesejada, mixHistorico, rentabilidade, taxaCartaoMedia]);

  return {
    isLoading: agendamentosQuery.isLoading || rentabilidade.isLoading,
    resultado,
    temHistorico: mixHistorico.length > 0,
    mixHistorico,
  };
}
