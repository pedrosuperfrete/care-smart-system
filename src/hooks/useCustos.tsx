import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from './useClinica';
import { toast } from 'sonner';

export interface Custo {
  id: string;
  clinica_id: string;
  nome: string;
  valor: number;
  tipo: 'fixo' | 'variavel';
  frequencia: 'mensal' | 'por_atendimento' | 'ocasional';
  descricao: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface CustoServico {
  id: string;
  custo_id: string;
  tipo_servico_id: string;
  tipo_aplicacao: 'integral' | 'rateio';
  percentual_rateio: number;
  criado_em: string;
}

export interface CustoInput {
  nome: string;
  valor: number;
  tipo: 'fixo' | 'variavel';
  frequencia: 'mensal' | 'por_atendimento' | 'ocasional';
  descricao?: string;
  aplicacao: 'todos' | 'especificos';
  servicos_ids?: string[];
  percentual_rateio?: number;
}

export function useCustos() {
  const { data: clinica } = useClinica();
  const queryClient = useQueryClient();

  // Buscar todos os custos da clínica
  const custosQuery = useQuery({
    queryKey: ['custos', clinica?.id],
    queryFn: async () => {
      if (!clinica?.id) return [];
      
      const { data, error } = await supabase
        .from('custos')
        .select('*')
        .eq('clinica_id', clinica.id)
        .eq('ativo', true)
        .order('tipo', { ascending: true })
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data as Custo[];
    },
    enabled: !!clinica?.id,
  });

  // Buscar associações custo-serviço
  const custosServicosQuery = useQuery({
    queryKey: ['custos-servicos', clinica?.id],
    queryFn: async () => {
      if (!clinica?.id) return [];
      
      const { data, error } = await supabase
        .from('custos_servicos')
        .select(`
          *,
          custos!inner(clinica_id)
        `)
        .eq('custos.clinica_id', clinica.id);
      
      if (error) throw error;
      return data as (CustoServico & { custos: { clinica_id: string } })[];
    },
    enabled: !!clinica?.id,
  });

  // Criar custo
  const criarCusto = useMutation({
    mutationFn: async (input: CustoInput) => {
      if (!clinica?.id) throw new Error('Clínica não encontrada');

      // 1. Criar o custo
      const { data: custo, error: custoError } = await supabase
        .from('custos')
        .insert({
          clinica_id: clinica.id,
          nome: input.nome,
          valor: input.valor,
          tipo: input.tipo,
          frequencia: input.frequencia,
          descricao: input.descricao || null,
          ativo: true,
        })
        .select()
        .single();

      if (custoError) throw custoError;

      // 2. Se for "todos", buscar todos os serviços e associar
      if (input.aplicacao === 'todos') {
        const { data: servicos } = await supabase
          .from('tipos_servicos')
          .select('id')
          .eq('clinica_id', clinica.id)
          .eq('ativo', true);

        if (servicos && servicos.length > 0) {
          const associacoes = servicos.map(s => ({
            custo_id: custo.id,
            tipo_servico_id: s.id,
            tipo_aplicacao: 'integral' as const,
            percentual_rateio: 100,
          }));

          await supabase.from('custos_servicos').insert(associacoes);
        }
      } else if (input.aplicacao === 'especificos' && input.servicos_ids?.length) {
        // 3. Se for "específicos", associar apenas aos serviços selecionados
        const associacoes = input.servicos_ids.map(servicoId => ({
          custo_id: custo.id,
          tipo_servico_id: servicoId,
          tipo_aplicacao: input.percentual_rateio && input.percentual_rateio < 100 ? 'rateio' as const : 'integral' as const,
          percentual_rateio: input.percentual_rateio || 100,
        }));

        await supabase.from('custos_servicos').insert(associacoes);
      }

      return custo;
    },
    onSuccess: () => {
      toast.success('Custo cadastrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['custos'] });
      queryClient.invalidateQueries({ queryKey: ['custos-servicos'] });
    },
    onError: (error) => {
      console.error('Erro ao criar custo:', error);
      toast.error('Erro ao cadastrar custo');
    },
  });

  // Atualizar custo
  const atualizarCusto = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Custo> & { id: string }) => {
      const { error } = await supabase
        .from('custos')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Custo atualizado!');
      queryClient.invalidateQueries({ queryKey: ['custos'] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar custo:', error);
      toast.error('Erro ao atualizar custo');
    },
  });

  // Deletar custo (soft delete)
  const deletarCusto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Custo excluído!');
      queryClient.invalidateQueries({ queryKey: ['custos'] });
      queryClient.invalidateQueries({ queryKey: ['custos-servicos'] });
    },
    onError: (error) => {
      console.error('Erro ao excluir custo:', error);
      toast.error('Erro ao excluir custo');
    },
  });

  return {
    custos: custosQuery.data || [],
    custosServicos: custosServicosQuery.data || [],
    isLoading: custosQuery.isLoading || custosServicosQuery.isLoading,
    criarCusto,
    atualizarCusto,
    deletarCusto,
  };
}

// Hook para calcular rentabilidade
export function useRentabilidade() {
  const { custos, custosServicos, isLoading: custosLoading } = useCustos();
  const { data: clinica } = useClinica();

  // Buscar tipos de serviços com preços
  const servicosQuery = useQuery({
    queryKey: ['tipos-servicos-rentabilidade', clinica?.id],
    queryFn: async () => {
      if (!clinica?.id) return [];
      
      const { data, error } = await supabase
        .from('tipos_servicos')
        .select('*')
        .eq('clinica_id', clinica.id)
        .eq('ativo', true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!clinica?.id,
  });

  const servicos = servicosQuery.data || [];

  // Calcular custo total mensal (custos fixos)
  const custoFixoTotal = custos
    .filter(c => c.tipo === 'fixo' && c.frequencia === 'mensal')
    .reduce((sum, c) => sum + Number(c.valor), 0);

  // Calcular custo variável médio por atendimento
  const custoVariavelPorAtendimento = custos
    .filter(c => c.tipo === 'variavel' && c.frequencia === 'por_atendimento')
    .reduce((sum, c) => sum + Number(c.valor), 0);

  // Calcular rentabilidade por serviço
  const rentabilidadePorServico = servicos.map(servico => {
    const preco = Number(servico.preco) || 0;
    
    // Custos fixos alocados a este serviço
    const custosServicoDeste = custosServicos.filter(cs => cs.tipo_servico_id === servico.id);
    const custoIdsAssociados = custosServicoDeste.map(cs => cs.custo_id);
    
    // Calcular custo fixo proporcional (rateio simples por número de serviços)
    const totalServicosComCustos = servicos.length || 1;
    const custoFixoProporcional = custoFixoTotal / totalServicosComCustos;
    
    // Custos variáveis específicos deste serviço
    const custosVariaveisEspecificos = custos
      .filter(c => c.tipo === 'variavel' && custoIdsAssociados.includes(c.id))
      .reduce((sum, c) => {
        const associacao = custosServicoDeste.find(cs => cs.custo_id === c.id);
        const percentual = associacao?.percentual_rateio || 100;
        return sum + (Number(c.valor) * percentual / 100);
      }, 0);

    const custoTotal = custoFixoProporcional + custoVariavelPorAtendimento + custosVariaveisEspecificos;
    const margem = preco - custoTotal;
    const margemPercentual = preco > 0 ? (margem / preco) * 100 : 0;

    return {
      id: servico.id,
      nome: servico.nome,
      preco,
      custoFixoProporcional,
      custoVariavel: custoVariavelPorAtendimento + custosVariaveisEspecificos,
      custoTotal,
      margem,
      margemPercentual,
      rentavel: margem > 0,
    };
  });

  // Ordenar por margem (mais rentável primeiro)
  const servicosOrdenados = [...rentabilidadePorServico].sort((a, b) => b.margem - a.margem);

  // Calcular break-even (quantos atendimentos para cobrir custos fixos)
  const ticketMedio = servicos.length > 0 
    ? servicos.reduce((sum, s) => sum + (Number(s.preco) || 0), 0) / servicos.length 
    : 0;
  
  const margemMedia = ticketMedio - custoVariavelPorAtendimento;
  const breakEven = margemMedia > 0 ? Math.ceil(custoFixoTotal / margemMedia) : 0;

  // Calcular atendimentos necessários para meta de ganho
  const calcularAtendimentosParaMeta = (meta: number) => {
    if (margemMedia <= 0) return Infinity;
    return Math.ceil((custoFixoTotal + meta) / margemMedia);
  };

  // Calcular break-even para um serviço específico
  const calcularBreakEvenPorServico = (servicoId: string) => {
    const servicoRentabilidade = rentabilidadePorServico.find(s => s.id === servicoId);
    if (!servicoRentabilidade || servicoRentabilidade.margem <= 0) return { breakEven: Infinity, margem: 0 };
    
    return {
      breakEven: Math.ceil(custoFixoTotal / servicoRentabilidade.margem),
      margem: servicoRentabilidade.margem,
    };
  };

  // Calcular atendimentos para meta por serviço específico
  const calcularAtendimentosParaMetaPorServico = (meta: number, servicoId: string) => {
    const servicoRentabilidade = rentabilidadePorServico.find(s => s.id === servicoId);
    if (!servicoRentabilidade || servicoRentabilidade.margem <= 0) return Infinity;
    
    return Math.ceil((custoFixoTotal + meta) / servicoRentabilidade.margem);
  };

  return {
    isLoading: custosLoading || servicosQuery.isLoading,
    custoFixoTotal,
    custoVariavelPorAtendimento,
    ticketMedio,
    margemMedia,
    breakEven,
    rentabilidadePorServico: servicosOrdenados,
    servicoMaisRentavel: servicosOrdenados[0] || null,
    servicoMenosRentavel: servicosOrdenados[servicosOrdenados.length - 1] || null,
    calcularAtendimentosParaMeta,
    calcularBreakEvenPorServico,
    calcularAtendimentosParaMetaPorServico,
    servicos,
    custos,
  };
}

// Hook para analisar mix de serviços com base nos agendamentos
export function useMixServicos() {
  const { data: clinica } = useClinica();
  const rentabilidade = useRentabilidade();

  // Buscar agendamentos realizados dos últimos 3 meses
  const agendamentosQuery = useQuery({
    queryKey: ['mix-servicos', clinica?.id],
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
        .in('status', ['realizado', 'confirmado']);

      if (error) throw error;
      return data || [];
    },
    enabled: !!clinica?.id,
  });

  const agendamentos = agendamentosQuery.data || [];

  // Calcular distribuição de serviços por mês
  const distribuicaoMensal = useMemo(() => {
    const distribuicao: Record<string, { total: number; porServico: Record<string, number> }> = {};
    
    agendamentos.forEach(ag => {
      const mes = new Date(ag.data_inicio).toISOString().slice(0, 7); // YYYY-MM
      if (!distribuicao[mes]) {
        distribuicao[mes] = { total: 0, porServico: {} };
      }
      distribuicao[mes].total++;
      distribuicao[mes].porServico[ag.tipo_servico] = (distribuicao[mes].porServico[ag.tipo_servico] || 0) + 1;
    });

    return distribuicao;
  }, [agendamentos]);

  // Calcular mix atual (percentuais)
  const mixAtual = useMemo(() => {
    const totalGeral = agendamentos.length;
    if (totalGeral === 0) return [];

    const contagem: Record<string, number> = {};
    agendamentos.forEach(ag => {
      contagem[ag.tipo_servico] = (contagem[ag.tipo_servico] || 0) + 1;
    });

    return Object.entries(contagem).map(([servico, quantidade]) => {
      const rentabilidadeServico = rentabilidade.rentabilidadePorServico.find(s => s.nome === servico);
      return {
        servico,
        quantidade,
        percentual: (quantidade / totalGeral) * 100,
        margem: rentabilidadeServico?.margem || 0,
        margemPercentual: rentabilidadeServico?.margemPercentual || 0,
        preco: rentabilidadeServico?.preco || 0,
        receitaTotal: quantidade * (rentabilidadeServico?.preco || 0),
        lucroTotal: quantidade * (rentabilidadeServico?.margem || 0),
      };
    }).sort((a, b) => b.quantidade - a.quantidade);
  }, [agendamentos, rentabilidade.rentabilidadePorServico]);

  // Análise inteligente de mix
  const analiseInteligente = useMemo(() => {
    if (mixAtual.length === 0) return null;

    const servicosPorMargem = [...mixAtual].sort((a, b) => b.margem - a.margem);
    const servicosPorVolume = [...mixAtual].sort((a, b) => b.quantidade - a.quantidade);
    const totalAtendMensal = agendamentos.length / 3;
    
    // Margem média ponderada atual
    const lucroAtualMensal = mixAtual.reduce((sum, s) => sum + s.lucroTotal, 0) / 3;
    const receitaAtualMensal = mixAtual.reduce((sum, s) => sum + s.receitaTotal, 0) / 3;
    const margemPonderadaAtual = receitaAtualMensal > 0 ? (lucroAtualMensal / receitaAtualMensal) * 100 : 0;

    // Identificar oportunidades perdidas
    const oportunidadesPerdidas: Array<{
      servico: string;
      tipo: 'alta_margem_baixo_volume' | 'baixa_margem_alto_volume' | 'equilibrado';
      margem: number;
      participacao: number;
      insight: string;
      acao: string;
      impactoMensal: number;
    }> = [];

    servicosPorMargem.forEach((servico) => {
      const rankMargem = servicosPorMargem.findIndex(s => s.servico === servico.servico);
      const rankVolume = servicosPorVolume.findIndex(s => s.servico === servico.servico);
      
      // Alta margem mas baixo volume = oportunidade
      if (rankMargem < servicosPorMargem.length / 2 && rankVolume >= servicosPorVolume.length / 2) {
        const servicoMenorMargem = servicosPorMargem[servicosPorMargem.length - 1];
        const atendimentosMigraveis = Math.min(servicoMenorMargem.quantidade / 3, totalAtendMensal * 0.15);
        const ganhoMigracao = atendimentosMigraveis * (servico.margem - servicoMenorMargem.margem);
        
        if (ganhoMigracao > 50) {
          oportunidadesPerdidas.push({
            servico: servico.servico,
            tipo: 'alta_margem_baixo_volume',
            margem: servico.margem,
            participacao: servico.percentual,
            insight: `Você tem um serviço "estrela" com ${servico.margemPercentual.toFixed(0)}% de margem, mas ele representa apenas ${servico.percentual.toFixed(0)}% dos seus atendimentos.`,
            acao: `Se 15% dos pacientes de "${servicoMenorMargem.servico}" migrarem para "${servico.servico}", você ganharia +R$ ${ganhoMigracao.toFixed(0)}/mês`,
            impactoMensal: ganhoMigracao,
          });
        }
      }
      
      // Baixa margem e alto volume = problema
      if (rankMargem >= servicosPorMargem.length / 2 && rankVolume < servicosPorVolume.length / 2) {
        const servicoMaiorMargem = servicosPorMargem[0];
        const perdaPotencial = (servico.quantidade / 3) * (servicoMaiorMargem.margem - servico.margem) * 0.1;
        
        if (servico.margem < servicoMaiorMargem.margem * 0.5 && perdaPotencial > 100) {
          oportunidadesPerdidas.push({
            servico: servico.servico,
            tipo: 'baixa_margem_alto_volume',
            margem: servico.margem,
            participacao: servico.percentual,
            insight: `"${servico.servico}" tem margem de apenas R$ ${servico.margem.toFixed(0)}, mas domina ${servico.percentual.toFixed(0)}% da sua agenda.`,
            acao: servico.margem <= 0 
              ? `Reveja o preço ou custos deste serviço - cada atendimento está dando prejuízo!`
              : `Considere aumentar o preço ou oferecer um upgrade para "${servicoMaiorMargem.servico}" durante as consultas.`,
            impactoMensal: servico.margem <= 0 ? Math.abs(servico.lucroTotal / 3) : perdaPotencial,
          });
        }
      }
    });

    // Cenário otimizado realista (30% de melhoria possível)
    const mixOtimizado = servicosPorMargem.map((s, idx) => {
      let novaParticipacao = s.percentual;
      if (idx === 0 && s.percentual < 50) {
        novaParticipacao = Math.min(50, s.percentual + 15);
      } else if (idx === servicosPorMargem.length - 1 && s.percentual > 20) {
        novaParticipacao = Math.max(10, s.percentual - 15);
      }
      return {
        ...s,
        novaParticipacao,
        novoLucro: (novaParticipacao / 100) * totalAtendMensal * s.margem,
      };
    });

    const lucroOtimizadoMensal = mixOtimizado.reduce((sum, s) => sum + s.novoLucro, 0);
    const ganhoOtimizacao = lucroOtimizadoMensal - lucroAtualMensal;

    // Diagnóstico geral
    let diagnostico: 'otimo' | 'bom' | 'atencao' | 'critico' = 'bom';
    let mensagemDiagnostico = '';
    
    const temPrejuizo = mixAtual.some(s => s.margem <= 0);
    const concentracaoBaixaMargem = servicosPorVolume[0]?.margem < servicosPorMargem[0]?.margem * 0.5;
    
    if (temPrejuizo) {
      diagnostico = 'critico';
      mensagemDiagnostico = 'Você tem serviços dando prejuízo! Reveja preços ou custos urgentemente.';
    } else if (concentracaoBaixaMargem && servicosPorVolume[0]?.percentual > 50) {
      diagnostico = 'atencao';
      mensagemDiagnostico = 'Seu serviço mais popular não é o mais rentável. Há espaço para melhorar.';
    } else if (ganhoOtimizacao < lucroAtualMensal * 0.1) {
      diagnostico = 'otimo';
      mensagemDiagnostico = 'Seu mix está bem equilibrado! Continue assim.';
    } else {
      diagnostico = 'bom';
      mensagemDiagnostico = 'Seu mix está razoável, mas há oportunidades de melhoria.';
    }

    return {
      diagnostico,
      mensagemDiagnostico,
      oportunidades: oportunidadesPerdidas.sort((a, b) => b.impactoMensal - a.impactoMensal),
      lucroAtualMensal,
      lucroOtimizadoMensal,
      ganhoOtimizacao,
      margemPonderadaAtual,
      servicoEstrela: servicosPorMargem[0],
      servicoProblematico: mixAtual.find(s => s.margem <= 0) || (concentracaoBaixaMargem ? servicosPorVolume[0] : null),
    };
  }, [mixAtual, agendamentos.length]);

  // Calcular métricas de performance do mix atual
  const performanceMix = useMemo(() => {
    if (mixAtual.length === 0) return null;

    const receitaTotal = mixAtual.reduce((sum, s) => sum + s.receitaTotal, 0);
    const lucroTotal = mixAtual.reduce((sum, s) => sum + s.lucroTotal, 0);
    const margemPonderada = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0;
    const atendimentosMensais = agendamentos.length / 3;

    // Calcular mix "ideal" (maximizando rentabilidade)
    const servicoMaisRentavel = rentabilidade.servicoMaisRentavel;
    const lucroIdeal = servicoMaisRentavel ? agendamentos.length * servicoMaisRentavel.margem / 3 : 0;
    const eficienciaMix = lucroIdeal > 0 ? (lucroTotal / 3 / lucroIdeal) * 100 : 0;

    return {
      receitaMensal: receitaTotal / 3,
      lucroMensal: lucroTotal / 3,
      margemPonderada,
      atendimentosMensais,
      eficienciaMix,
      potencialGanhoOtimizacao: (lucroIdeal - lucroTotal / 3) * 0.3, // 30% de captura realista
    };
  }, [mixAtual, agendamentos.length, rentabilidade.servicoMaisRentavel]);

  return {
    isLoading: agendamentosQuery.isLoading || rentabilidade.isLoading,
    mixAtual,
    distribuicaoMensal,
    analiseInteligente,
    performanceMix,
    totalAtendimentos: agendamentos.length,
  };
}
