import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinica } from './useClinica';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

export interface Custo {
  id: string;
  clinica_id: string;
  nome: string;
  valor_estimado: number;
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
  valor_estimado: number;
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
          valor_estimado: input.valor_estimado,
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
    mutationFn: async ({ id, aplicacao, servicos_ids, percentual_rateio, ...data }: Partial<CustoInput> & { id: string }) => {
      if (!clinica?.id) throw new Error('Clínica não encontrada');

      // 1. Atualizar dados básicos do custo
      const { error } = await supabase
        .from('custos')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      // 2. Deletar associações antigas
      await supabase
        .from('custos_servicos')
        .delete()
        .eq('custo_id', id);

      // 3. Se for "todos", buscar todos os serviços e associar
      if (aplicacao === 'todos') {
        const { data: servicos } = await supabase
          .from('tipos_servicos')
          .select('id')
          .eq('clinica_id', clinica.id)
          .eq('ativo', true);

        if (servicos && servicos.length > 0) {
          const associacoes = servicos.map(s => ({
            custo_id: id,
            tipo_servico_id: s.id,
            tipo_aplicacao: 'integral' as const,
            percentual_rateio: 100,
          }));

          await supabase.from('custos_servicos').insert(associacoes);
        }
      } else if (aplicacao === 'especificos' && servicos_ids?.length) {
        // 4. Se for "específicos", associar apenas aos serviços selecionados
        const associacoes = servicos_ids.map(servicoId => ({
          custo_id: id,
          tipo_servico_id: servicoId,
          tipo_aplicacao: percentual_rateio && percentual_rateio < 100 ? 'rateio' as const : 'integral' as const,
          percentual_rateio: percentual_rateio || 100,
        }));

        await supabase.from('custos_servicos').insert(associacoes);
      }
    },
    onSuccess: () => {
      toast.success('Custo atualizado!');
      queryClient.invalidateQueries({ queryKey: ['custos'] });
      queryClient.invalidateQueries({ queryKey: ['custos-servicos'] });
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

  // Identificar custos que estão associados a serviços específicos
  const custosComAssociacaoEspecifica = new Set(custosServicos.map(cs => cs.custo_id));
  
  // Custos fixos gerais (aplicados a todos - não têm associação específica ou estão em todos os serviços)
  const custosFixosGerais = custos.filter(c => {
    if (c.tipo !== 'fixo' || c.frequencia !== 'mensal') return false;
    
    // Se não tem nenhuma associação específica, é geral
    if (!custosComAssociacaoEspecifica.has(c.id)) return true;
    
    // Se tem associação com todos os serviços, também é geral (será rateado)
    const associacoesDesteCusto = custosServicos.filter(cs => cs.custo_id === c.id);
    return associacoesDesteCusto.length >= servicos.length;
  });
  
  const custoFixoGeral = custosFixosGerais.reduce((sum, c) => sum + Number(c.valor_estimado), 0);
  
  // Custos fixos específicos (associados a serviços específicos, não a todos)
  const custosFixosEspecificos = custos.filter(c => {
    if (c.tipo !== 'fixo' || c.frequencia !== 'mensal') return false;
    if (!custosComAssociacaoEspecifica.has(c.id)) return false;
    
    const associacoesDesteCusto = custosServicos.filter(cs => cs.custo_id === c.id);
    return associacoesDesteCusto.length > 0 && associacoesDesteCusto.length < servicos.length;
  });

  // Calcular custo total mensal (custos fixos - para exibição geral)
  const custoFixoTotal = custos
    .filter(c => c.tipo === 'fixo' && c.frequencia === 'mensal')
    .reduce((sum, c) => sum + Number(c.valor_estimado), 0);

  // Calcular custo variável médio por atendimento (custos gerais - aplicados a todos)
  const custosVariaveisGerais = custos.filter(c => {
    if (c.tipo !== 'variavel' || c.frequencia !== 'por_atendimento') return false;
    if (!custosComAssociacaoEspecifica.has(c.id)) return true;
    const associacoesDesteCusto = custosServicos.filter(cs => cs.custo_id === c.id);
    return associacoesDesteCusto.length >= servicos.length;
  });
  
  const custoVariavelPorAtendimento = custosVariaveisGerais.reduce((sum, c) => sum + Number(c.valor_estimado), 0);

  // Calcular rentabilidade por serviço
  const rentabilidadePorServico = servicos.map(servico => {
    const preco = Number(servico.preco) || 0;
    
    // Custos associados a este serviço específico
    const custosServicoDeste = custosServicos.filter(cs => cs.tipo_servico_id === servico.id);
    const custoIdsAssociados = custosServicoDeste.map(cs => cs.custo_id);
    
    // 1. Custo fixo geral rateado entre todos os serviços
    const totalServicosComCustos = servicos.length || 1;
    const custoFixoGeralRateado = custoFixoGeral / totalServicosComCustos;
    
    // 2. Custos fixos específicos deste serviço (não rateados - 100% para os serviços vinculados)
    const custoFixoEspecifico = custosFixosEspecificos
      .filter(c => custoIdsAssociados.includes(c.id))
      .reduce((sum, c) => {
        const associacao = custosServicoDeste.find(cs => cs.custo_id === c.id);
        const percentual = associacao?.percentual_rateio || 100;
        // Ratear entre os serviços vinculados a este custo
        const servicosVinculados = custosServicos.filter(cs => cs.custo_id === c.id).length || 1;
        return sum + (Number(c.valor_estimado) * percentual / 100) / servicosVinculados;
      }, 0);
    
    // 3. Custos variáveis específicos deste serviço
    const custosVariaveisEspecificos = custos
      .filter(c => c.tipo === 'variavel' && c.frequencia === 'por_atendimento' && custoIdsAssociados.includes(c.id))
      .filter(c => {
        // Verificar se é custo específico (não está em todos os serviços)
        const associacoesDesteCusto = custosServicos.filter(cs => cs.custo_id === c.id);
        return associacoesDesteCusto.length < servicos.length;
      })
      .reduce((sum, c) => {
        const associacao = custosServicoDeste.find(cs => cs.custo_id === c.id);
        const percentual = associacao?.percentual_rateio || 100;
        return sum + (Number(c.valor_estimado) * percentual / 100);
      }, 0);

    const custoFixoProporcional = custoFixoGeralRateado + custoFixoEspecifico;
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
    const totalAtendMensal = Math.max(agendamentos.length / 3, 1);
    
    // Margem média ponderada atual
    const lucroAtualMensal = mixAtual.reduce((sum, s) => sum + s.lucroTotal, 0) / 3;
    const receitaAtualMensal = mixAtual.reduce((sum, s) => sum + s.receitaTotal, 0) / 3;
    const margemPonderadaAtual = receitaAtualMensal > 0 ? (lucroAtualMensal / receitaAtualMensal) * 100 : 0;

    // Insights e oportunidades
    const insights: Array<{
      servico: string;
      tipo: 'oportunidade' | 'problema' | 'dica';
      prioridade: 'alta' | 'media' | 'baixa';
      titulo: string;
      descricao: string;
      acao: string;
      impactoMensal: number;
    }> = [];

    // 1. Identificar serviços com prejuízo
    mixAtual.filter(s => s.margem <= 0).forEach(servico => {
      const prejuizoMensal = Math.abs(servico.lucroTotal / 3);
      insights.push({
        servico: servico.servico,
        tipo: 'problema',
        prioridade: 'alta',
        titulo: `"${servico.servico}" está dando prejuízo`,
        descricao: `Cada atendimento de "${servico.servico}" custa mais do que você cobra. Você está perdendo R$ ${formatCurrency(Math.abs(servico.margem))} por atendimento.`,
        acao: `Aumente o preço em pelo menos ${formatCurrency(Math.abs(servico.margem) + 10)} ou reduza os custos associados a este serviço.`,
        impactoMensal: prejuizoMensal,
      });
    });

    // 2. Comparar margens entre serviços
    if (servicosPorMargem.length >= 2) {
      const melhor = servicosPorMargem[0];
      const pior = servicosPorMargem[servicosPorMargem.length - 1];
      
      if (melhor.margem > 0 && pior.margem >= 0 && melhor.margem > pior.margem * 1.5) {
        // Se o melhor tem margem bem maior que o pior
        if (pior.percentual > melhor.percentual) {
          // Se o pior representa mais atendimentos
          const atendimentosPotenciais = Math.ceil((pior.quantidade / 3) * 0.2); // 20% dos atendimentos
          const ganho = atendimentosPotenciais * (melhor.margem - pior.margem);
          
          insights.push({
            servico: melhor.servico,
            tipo: 'oportunidade',
            prioridade: 'alta',
            titulo: `Migre pacientes para "${melhor.servico}"`,
            descricao: `"${melhor.servico}" tem margem ${((melhor.margem / Math.max(pior.margem, 1)) * 100 - 100).toFixed(0)}% maior que "${pior.servico}", mas representa apenas ${melhor.percentual.toFixed(0)}% dos atendimentos.`,
            acao: `Se 20% dos pacientes de "${pior.servico}" migrarem para "${melhor.servico}", você ganharia +R$ ${formatCurrency(ganho)}/mês.`,
            impactoMensal: ganho,
          });
        }
      }
    }

    // 3. Sugestão de aumento de preço para serviços populares com margem baixa
    servicosPorVolume.forEach(servico => {
      if (servico.margem > 0 && servico.margemPercentual < 30 && servico.percentual >= 30) {
        const aumentoSugerido = servico.preco * 0.1; // 10% de aumento
        const impacto = (servico.quantidade / 3) * aumentoSugerido;
        
        insights.push({
          servico: servico.servico,
          tipo: 'dica',
          prioridade: 'media',
          titulo: `Reveja o preço de "${servico.servico}"`,
          descricao: `Este serviço representa ${servico.percentual.toFixed(0)}% dos seus atendimentos, mas tem margem de apenas ${servico.margemPercentual.toFixed(0)}%.`,
          acao: `Um aumento de 10% no preço (de R$ ${formatCurrency(servico.preco)} para R$ ${formatCurrency(servico.preco * 1.1)}) geraria +R$ ${formatCurrency(impacto)}/mês.`,
          impactoMensal: impacto,
        });
      }
    });

    // 4. Dica para o serviço mais rentável
    if (servicosPorMargem[0]?.margem > 0 && servicosPorMargem[0]?.percentual < 40) {
      const melhor = servicosPorMargem[0];
      const atendimentosExtras = Math.ceil(totalAtendMensal * 0.1); // 10% mais atendimentos
      const ganhoPotencial = atendimentosExtras * melhor.margem;
      
      insights.push({
        servico: melhor.servico,
        tipo: 'oportunidade',
        prioridade: 'media',
        titulo: `Promova mais "${melhor.servico}"`,
        descricao: `Este é seu serviço mais rentável com R$ ${formatCurrency(melhor.margem)} de lucro por atendimento, mas representa apenas ${melhor.percentual.toFixed(0)}% da agenda.`,
        acao: `Aumente a visibilidade deste serviço no marketing e ofereça-o durante outras consultas. +10% de volume = +R$ ${formatCurrency(ganhoPotencial)}/mês.`,
        impactoMensal: ganhoPotencial,
      });
    }

    // Ordenar insights por prioridade e impacto
    const oportunidadesOrdenadas = insights.sort((a, b) => {
      const prioridadeOrdem = { alta: 0, media: 1, baixa: 2 };
      if (prioridadeOrdem[a.prioridade] !== prioridadeOrdem[b.prioridade]) {
        return prioridadeOrdem[a.prioridade] - prioridadeOrdem[b.prioridade];
      }
      return b.impactoMensal - a.impactoMensal;
    });

    // Calcular potencial total de otimização
    const ganhoOtimizacao = oportunidadesOrdenadas
      .filter(i => i.tipo !== 'problema')
      .reduce((sum, i) => sum + i.impactoMensal, 0);

    // Diagnóstico geral
    let diagnostico: 'otimo' | 'bom' | 'atencao' | 'critico' = 'bom';
    let mensagemDiagnostico = '';
    
    const temPrejuizo = mixAtual.some(s => s.margem <= 0);
    const todasMargensBaixas = mixAtual.every(s => s.margemPercentual < 25);
    const servicoMaisPopularNaoERentavel = servicosPorVolume[0] && servicosPorMargem[0] && 
      servicosPorVolume[0].servico !== servicosPorMargem[0].servico && 
      servicosPorVolume[0].margem < servicosPorMargem[0].margem * 0.6;
    
    if (temPrejuizo) {
      diagnostico = 'critico';
      mensagemDiagnostico = 'Você tem serviços dando prejuízo! Reveja preços ou custos urgentemente.';
    } else if (todasMargensBaixas) {
      diagnostico = 'atencao';
      mensagemDiagnostico = 'Suas margens estão baixas em geral. Considere rever seus preços ou reduzir custos.';
    } else if (servicoMaisPopularNaoERentavel) {
      diagnostico = 'atencao';
      mensagemDiagnostico = 'Seu serviço mais popular não é o mais rentável. Há espaço para melhorar.';
    } else if (oportunidadesOrdenadas.length === 0 || ganhoOtimizacao < lucroAtualMensal * 0.05) {
      diagnostico = 'otimo';
      mensagemDiagnostico = 'Seu mix está bem equilibrado! Continue monitorando.';
    } else {
      diagnostico = 'bom';
      mensagemDiagnostico = 'Seu mix está razoável. Veja as oportunidades abaixo para melhorar.';
    }

    return {
      diagnostico,
      mensagemDiagnostico,
      oportunidades: oportunidadesOrdenadas,
      lucroAtualMensal,
      lucroOtimizadoMensal: lucroAtualMensal + ganhoOtimizacao,
      ganhoOtimizacao,
      margemPonderadaAtual,
      servicoEstrela: servicosPorMargem[0],
      servicoProblematico: mixAtual.find(s => s.margem <= 0) || null,
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
