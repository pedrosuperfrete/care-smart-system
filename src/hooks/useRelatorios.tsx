import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface EstatisticaRelatorio {
  titulo: string;
  valor: string;
  mudanca: string;
  tipo: 'positivo' | 'negativo';
  icon: any;
  descricao: string;
}

export interface DadosGrafico {
  dia?: string;
  mes?: string;
  consultas?: number;
  receita?: number;
}

export interface TipoConsulta {
  nome: string;
  valor: number;
  cor: string;
}

export const useRelatorios = (periodo: string = 'mes') => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticaRelatorio[]>([]);
  const [consultasPorDia, setConsultasPorDia] = useState<DadosGrafico[]>([]);
  const [receitaPorMes, setReceitaPorMes] = useState<DadosGrafico[]>([]);
  const [tiposConsulta, setTiposConsulta] = useState<TipoConsulta[]>([]);

  const getDateRange = (periodo: string) => {
    const hoje = new Date();
    
    switch (periodo) {
      case 'semana':
        return {
          inicio: startOfWeek(hoje, { locale: ptBR }),
          fim: endOfWeek(hoje, { locale: ptBR })
        };
      case 'mes':
        return {
          inicio: startOfMonth(hoje),
          fim: endOfMonth(hoje)
        };
      case 'trimestre':
        return {
          inicio: startOfMonth(subMonths(hoje, 2)),
          fim: endOfMonth(hoje)
        };
      case 'ano':
        return {
          inicio: startOfYear(hoje),
          fim: endOfYear(hoje)
        };
      default:
        return {
          inicio: startOfMonth(hoje),
          fim: endOfMonth(hoje)
        };
    }
  };

  const buscarEstatisticas = async () => {
    if (!user) return;

    try {
      const { inicio, fim } = getDateRange(periodo);
      const { inicio: inicioAnterior, fim: fimAnterior } = getDateRange(periodo === 'mes' ? 'mes' : periodo);
      
      // Ajustar período anterior baseado no período atual
      const periodoAnterior = {
        inicio: periodo === 'mes' ? startOfMonth(subMonths(inicio, 1)) : startOfMonth(subMonths(inicio, 1)),
        fim: periodo === 'mes' ? endOfMonth(subMonths(fim, 1)) : endOfMonth(subMonths(fim, 1))
      };

      // Buscar profissional atual
      const { data: profissional } = await supabase
        .from('profissionais')
        .select('id, clinica_id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .single();

      if (!profissional) return;

      // 1. Total de consultas do período atual - apenas do profissional logado
      const { data: consultasAtual } = await supabase
        .from('agendamentos')
        .select('id, status')
        .eq('profissional_id', profissional.id)
        .gte('data_inicio', inicio.toISOString())
        .lte('data_inicio', fim.toISOString());

      // 2. Total de consultas do período anterior - apenas do profissional logado
      const { data: consultasAnterior } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('profissional_id', profissional.id)
        .gte('data_inicio', periodoAnterior.inicio.toISOString())
        .lte('data_inicio', periodoAnterior.fim.toISOString());

      // 3. Novos pacientes (primeira consulta no período) - apenas do profissional logado
      const { data: pacientesNovos } = await supabase
        .from('agendamentos')
        .select('paciente_id')
        .eq('profissional_id', profissional.id)
        .gte('data_inicio', inicio.toISOString())
        .lte('data_inicio', fim.toISOString());

      const pacientesUnicos = new Set(pacientesNovos?.map(p => p.paciente_id) || []);

      // 4. Receita total do período - apenas do profissional logado
      console.log('Buscando receita para profissional:', profissional.id, 'período:', inicio, 'até', fim);
      
      // Buscar agendamentos do profissional no período primeiro
      const { data: agendamentosPeriodo } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('profissional_id', profissional.id)
        .gte('data_inicio', inicio.toISOString())
        .lte('data_inicio', fim.toISOString());

      if (!agendamentosPeriodo || agendamentosPeriodo.length === 0) {
        console.log('Nenhum agendamento encontrado no período');
        const receitaTotal = 0;
        console.log('Receita total calculada:', receitaTotal);
        // Não retornar aqui, continuar com receita = 0
      }

      let receitaTotal = 0;
      
      if (agendamentosPeriodo && agendamentosPeriodo.length > 0) {
        const agendamentoIds = agendamentosPeriodo.map(a => a.id);
        console.log('Agendamentos do período:', agendamentoIds);
        
        // Buscar pagamentos desses agendamentos específicos
        const { data: pagamentos, error: receitaError } = await supabase
          .from('pagamentos')
          .select('valor_pago, valor_total, status')
          .in('agendamento_id', agendamentoIds)
          .eq('status', 'pago');

        if (receitaError) {
          console.error('Erro ao buscar receita:', receitaError);
        }
        
        console.log('Pagamentos encontrados para receita no período:', pagamentos);
        receitaTotal = pagamentos?.reduce((acc, p) => acc + (Number(p.valor_pago) > 0 ? Number(p.valor_pago) : Number(p.valor_total)), 0) || 0;
      }
      
      console.log('Receita total calculada:', receitaTotal);

      // 5. Taxa de retorno (pacientes que tiveram mais de uma consulta) - apenas do profissional logado
      const { data: todasConsultas } = await supabase
        .from('agendamentos')
        .select(`
          paciente_id
        `)
        .eq('profissional_id', profissional.id)
        .eq('status', 'realizado');

      const consultasPorPaciente = todasConsultas?.reduce((acc: any, consulta) => {
        acc[consulta.paciente_id] = (acc[consulta.paciente_id] || 0) + 1;
        return acc;
      }, {}) || {};

      const pacientesComRetorno = Object.values(consultasPorPaciente).filter((count: any) => count > 1).length;
      const totalPacientes = Object.keys(consultasPorPaciente).length;
      const taxaRetorno = totalPacientes > 0 ? (pacientesComRetorno / totalPacientes) * 100 : 0;

      // Calcular mudanças percentuais
      const totalConsultasAtual = consultasAtual?.length || 0;
      const totalConsultasAnterior = consultasAnterior?.length || 0;
      const mudancaConsultas = totalConsultasAnterior > 0 
        ? ((totalConsultasAtual - totalConsultasAnterior) / totalConsultasAnterior) * 100 
        : 0;

      setEstatisticas([
        {
          titulo: 'Total de Consultas',
          valor: totalConsultasAtual.toString(),
          mudanca: `${mudancaConsultas >= 0 ? '+' : ''}${mudancaConsultas.toFixed(1)}%`,
          tipo: mudancaConsultas >= 0 ? 'positivo' : 'negativo',
          icon: 'FileText',
          descricao: periodo === 'mes' ? 'Este mês' : `Este ${periodo}`
        },
        {
          titulo: 'Novos Pacientes',
          valor: pacientesUnicos.size.toString(),
          mudanca: '+0%', // Seria necessário comparar com período anterior
          tipo: 'positivo',
          icon: 'Users',
          descricao: periodo === 'mes' ? 'Este mês' : `Este ${periodo}`
        },
        {
          titulo: 'Receita Total',
          valor: `R$ ${receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          mudanca: '+0%', // Seria necessário comparar com período anterior
          tipo: 'positivo',
          icon: 'DollarSign',
          descricao: periodo === 'mes' ? 'Este mês' : `Este ${periodo}`
        },
        {
          titulo: 'Taxa de Retorno',
          valor: `${taxaRetorno.toFixed(1)}%`,
          mudanca: '+0%',
          tipo: 'positivo',
          icon: 'TrendingUp',
          descricao: 'Pacientes que retornaram'
        }
      ]);

    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      setError('Erro ao carregar estatísticas');
    }
  };

  const buscarConsultasPorDia = async () => {
    if (!user) return;

    try {
      const { data: profissional } = await supabase
        .from('profissionais')
        .select('id, clinica_id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .single();

      if (!profissional) return;

      // Buscar consultas dos últimos 7 dias
      const ultimosDias = Array.from({ length: 7 }, (_, i) => {
        const data = subDays(new Date(), 6 - i);
        return format(data, 'yyyy-MM-dd');
      });

      const dadosPorDia = await Promise.all(
        ultimosDias.map(async (dia) => {
          const { data: consultas } = await supabase
            .from('agendamentos')
            .select('id')
            .eq('profissional_id', profissional.id)
            .gte('data_inicio', `${dia}T00:00:00`)
            .lt('data_inicio', `${dia}T23:59:59`);

          return {
            dia: format(new Date(dia), 'dd/MM'),
            consultas: consultas?.length || 0
          };
        })
      );

      setConsultasPorDia(dadosPorDia);
    } catch (err) {
      console.error('Erro ao buscar consultas por dia:', err);
    }
  };

  const buscarReceitaPorMes = async () => {
    if (!user) return;

    try {
      const { data: profissional } = await supabase
        .from('profissionais')
        .select('id, clinica_id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .single();

      if (!profissional) return;

      // Buscar receita dos últimos 6 meses
      const ultimosMeses = Array.from({ length: 6 }, (_, i) => {
        const data = subMonths(new Date(), 5 - i);
        return {
          mes: format(data, 'MMM', { locale: ptBR }),
          inicio: startOfMonth(data),
          fim: endOfMonth(data)
        };
      });

      console.log('Buscando receita mensal para profissional:', profissional.id);

      const dadosPorMes = await Promise.all(
        ultimosMeses.map(async ({ mes, inicio, fim }) => {
          console.log(`Buscando receita para ${mes}: ${inicio.toISOString()} - ${fim.toISOString()}`);
          
          // Primeiro buscar agendamentos do profissional no período
          const { data: agendamentos } = await supabase
            .from('agendamentos')
            .select('id')
            .eq('profissional_id', profissional.id)
            .gte('data_inicio', inicio.toISOString())
            .lte('data_inicio', fim.toISOString());

          if (!agendamentos || agendamentos.length === 0) {
            console.log(`Nenhum agendamento para ${mes}`);
            return { mes, receita: 0 };
          }

          const agendamentoIds = agendamentos.map(a => a.id);
          console.log(`Agendamentos de ${mes}:`, agendamentoIds);

          // Agora buscar pagamentos desses agendamentos
          const { data: pagamentos, error } = await supabase
            .from('pagamentos')
            .select('valor_pago, valor_total, status')
            .in('agendamento_id', agendamentoIds)
            .eq('status', 'pago');

          if (error) {
            console.error(`Erro buscar receita mensal para ${mes}:`, error);
            return { mes, receita: 0 };
          }
          
          console.log(`Pagamentos pagos de ${mes}:`, pagamentos);
          const receita = pagamentos?.reduce((acc, p) => acc + (Number(p.valor_pago) > 0 ? Number(p.valor_pago) : Number(p.valor_total)), 0) || 0;
          console.log(`Receita ${mes}:`, receita);

          return { mes, receita };
        })
      );

      console.log('Dados finais por mês:', dadosPorMes);
      setReceitaPorMes(dadosPorMes);
    } catch (err) {
      console.error('Erro ao buscar receita por mês:', err);
    }
  };

  const buscarTiposConsulta = async () => {
    if (!user) return;

    try {
      const { data: profissional } = await supabase
        .from('profissionais')
        .select('id, clinica_id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .single();

      if (!profissional) return;

      const { inicio, fim } = getDateRange(periodo);

      const { data: agendamentos } = await supabase
        .from('agendamentos')
        .select('tipo_servico')
        .eq('profissional_id', profissional.id)
        .gte('data_inicio', inicio.toISOString())
        .lte('data_inicio', fim.toISOString());

      // Agrupar por tipo de serviço
      const tipos = agendamentos?.reduce((acc: any, ag) => {
        acc[ag.tipo_servico] = (acc[ag.tipo_servico] || 0) + 1;
        return acc;
      }, {}) || {};

      const total = Object.values(tipos).reduce((acc: number, val: any) => acc + val, 0) as number;

      const tiposFormatados = Object.entries(tipos).map(([tipo, quantidade]: [string, any]) => ({
        nome: tipo,
        valor: total > 0 ? Math.round((quantidade / total) * 100) : 0,
        cor: 'hsl(var(--primary))'
      }));

      setTiposConsulta(tiposFormatados);
    } catch (err) {
      console.error('Erro ao buscar tipos de consulta:', err);
    }
  };

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      setError(null);

      await Promise.all([
        buscarEstatisticas(),
        buscarConsultasPorDia(),
        buscarReceitaPorMes(),
        buscarTiposConsulta()
      ]);

      setLoading(false);
    };

    if (user) {
      carregarDados();
    }
  }, [user, periodo]);

  return {
    loading,
    error,
    estatisticas,
    consultasPorDia,
    receitaPorMes,
    tiposConsulta
  };
};