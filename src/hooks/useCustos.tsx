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

  // Gerar sugestões de otimização
  const sugestoesOtimizacao = useMemo(() => {
    if (mixAtual.length < 2) return [];

    const sugestoes: Array<{
      tipo: 'aumentar' | 'diminuir' | 'manter';
      servico: string;
      motivo: string;
      impactoEstimado: number;
      percentualAtual: number;
      margemServico: number;
    }> = [];

    // Ordenar por margem
    const servicosPorMargem = [...mixAtual].sort((a, b) => b.margem - a.margem);
    const margemMediaMix = mixAtual.reduce((sum, s) => sum + (s.margem * s.percentual / 100), 0);

    servicosPorMargem.forEach((servico, index) => {
      // Serviços mais rentáveis (top 30% por margem) que estão sub-representados
      if (index < servicosPorMargem.length * 0.3 && servico.margem > margemMediaMix) {
        if (servico.percentual < 40) {
          const aumentoPotencial = Math.min(10, 40 - servico.percentual);
          sugestoes.push({
            tipo: 'aumentar',
            servico: servico.servico,
            motivo: `Margem de R$ ${servico.margem.toFixed(0)} por atendimento, acima da média do mix.`,
            impactoEstimado: aumentoPotencial * servico.margem / 100 * agendamentos.length / 3,
            percentualAtual: servico.percentual,
            margemServico: servico.margem,
          });
        }
      }

      // Serviços menos rentáveis (bottom 30% por margem) que estão sobre-representados
      if (index >= servicosPorMargem.length * 0.7 && servico.margem < margemMediaMix) {
        if (servico.percentual > 20 && servico.margem < margemMediaMix * 0.7) {
          const reducaoPotencial = Math.min(10, servico.percentual - 15);
          const servicoMaisRentavel = servicosPorMargem[0];
          const ganhoMigracao = (servicoMaisRentavel.margem - servico.margem) * reducaoPotencial / 100 * agendamentos.length / 3;
          
          sugestoes.push({
            tipo: 'diminuir',
            servico: servico.servico,
            motivo: `Margem de R$ ${servico.margem.toFixed(0)} está abaixo da média. Considere migrar para "${servicoMaisRentavel.servico}".`,
            impactoEstimado: ganhoMigracao,
            percentualAtual: servico.percentual,
            margemServico: servico.margem,
          });
        }
      }
    });

    return sugestoes.sort((a, b) => Math.abs(b.impactoEstimado) - Math.abs(a.impactoEstimado));
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
    sugestoesOtimizacao,
    performanceMix,
    totalAtendimentos: agendamentos.length,
  };
}
