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
  recebido?: number;
  aReceber?: number;
  aGanhar?: number;
  emAtraso?: number;
  pacientes?: number;
}

export interface TipoConsulta {
  nome: string;
  valor: number;
  cor: string;
}

export interface StatusConsulta {
  nome: string;
  valor: number;
  cor: string;
}

export interface StatusPagamento {
  nome: string;
  valor: number;
  cor: string;
}

export const useRelatorios = (periodo: string = 'mes', dataInicio?: Date, dataFim?: Date) => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticaRelatorio[]>([]);
  const [consultasPorDia, setConsultasPorDia] = useState<DadosGrafico[]>([]);
  const [receitaPorMes, setReceitaPorMes] = useState<DadosGrafico[]>([]);
  const [novosPacientesPorMes, setNovosPacientesPorMes] = useState<DadosGrafico[]>([]);
  const [tiposConsulta, setTiposConsulta] = useState<TipoConsulta[]>([]);
  const [statusConsultas, setStatusConsultas] = useState<StatusConsulta[]>([]);
  const [statusPagamentos, setStatusPagamentos] = useState<StatusPagamento[]>([]);

  const getDateRange = (periodo: string) => {
    // Se datas customizadas foram fornecidas, usar elas
    if (dataInicio && dataFim) {
      return {
        inicio: dataInicio,
        fim: dataFim
      };
    }
    
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
    if (!user || !userProfile) return;

    try {
      const { inicio, fim } = getDateRange(periodo);
      const { inicio: inicioAnterior, fim: fimAnterior } = getDateRange(periodo === 'mes' ? 'mes' : periodo);
      
      // Ajustar período anterior baseado no período atual
      const periodoAnterior = {
        inicio: periodo === 'mes' ? startOfMonth(subMonths(inicio, 1)) : startOfMonth(subMonths(inicio, 1)),
        fim: periodo === 'mes' ? endOfMonth(subMonths(fim, 1)) : endOfMonth(subMonths(fim, 1))
      };

      let profissionalIds: string[] = [];

      // Se for profissional, usar apenas seu ID
      if (userProfile.tipo_usuario === 'profissional') {
        const { data: profissional } = await supabase
          .from('profissionais')
          .select('id, clinica_id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle();

        if (!profissional) return;
        profissionalIds = [profissional.id];
      } 
      // Se for recepcionista, buscar profissionais da clínica
      else if (userProfile.tipo_usuario === 'recepcionista') {
        // Buscar clínica do usuário
        const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
        
        if (!clinicasUsuario || clinicasUsuario.length === 0) return;

        const clinicaId = clinicasUsuario[0].clinica_id;

        // Buscar profissionais da clínica
        const { data: profissionais } = await supabase
          .from('profissionais')
          .select('id')
          .eq('clinica_id', clinicaId)
          .eq('ativo', true);

        if (!profissionais || profissionais.length === 0) return;
        profissionalIds = profissionais.map(p => p.id);
      }
      // Se for admin, buscar todos os profissionais
      else if (userProfile.tipo_usuario === 'admin') {
        const { data: profissionais } = await supabase
          .from('profissionais')
          .select('id')
          .eq('ativo', true);

        if (!profissionais || profissionais.length === 0) return;
        profissionalIds = profissionais.map(p => p.id);
      }

      if (profissionalIds.length === 0) return;

      // 1. Total de consultas do período atual
      const { data: consultasAtual } = await supabase
        .from('agendamentos')
        .select('id, status')
        .in('profissional_id', profissionalIds)
        .gte('data_inicio', inicio.toISOString())
        .lte('data_inicio', fim.toISOString());

      // 2. Total de consultas do período anterior
      const { data: consultasAnterior } = await supabase
        .from('agendamentos')
        .select('id')
        .in('profissional_id', profissionalIds)
        .gte('data_inicio', periodoAnterior.inicio.toISOString())
        .lte('data_inicio', periodoAnterior.fim.toISOString());

      // 3. Novos pacientes (primeira consulta no período)
      const { data: pacientesNovos } = await supabase
        .from('agendamentos')
        .select('paciente_id')
        .in('profissional_id', profissionalIds)
        .gte('data_inicio', inicio.toISOString())
        .lte('data_inicio', fim.toISOString());

      const pacientesUnicos = new Set(pacientesNovos?.map(p => p.paciente_id) || []);

      // 4. Receita total do período
      console.log('Buscando receita para profissionais:', profissionalIds, 'período:', inicio, 'até', fim);
      
      // Buscar agendamentos dos profissionais no período primeiro
      const { data: agendamentosPeriodo } = await supabase
        .from('agendamentos')
        .select('id')
        .in('profissional_id', profissionalIds)
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

      // 5. Taxa de retorno (pacientes que tiveram mais de uma consulta)
      const { data: todasConsultas } = await supabase
        .from('agendamentos')
        .select(`
          paciente_id
        `)
        .in('profissional_id', profissionalIds)
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
    if (!user || !userProfile) return;

    try {
      let profissionalIds: string[] = [];

      // Se for profissional, usar apenas seu ID
      if (userProfile.tipo_usuario === 'profissional') {
        const { data: profissional } = await supabase
          .from('profissionais')
          .select('id, clinica_id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle();

        if (!profissional) return;
        profissionalIds = [profissional.id];
      } 
      // Se for recepcionista, buscar profissionais da clínica
      else if (userProfile.tipo_usuario === 'recepcionista') {
        // Buscar clínica do usuário
        const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
        
        if (!clinicasUsuario || clinicasUsuario.length === 0) return;

        const clinicaId = clinicasUsuario[0].clinica_id;

        // Buscar profissionais da clínica
        const { data: profissionais } = await supabase
          .from('profissionais')
          .select('id')
          .eq('clinica_id', clinicaId)
          .eq('ativo', true);

        if (!profissionais || profissionais.length === 0) return;
        profissionalIds = profissionais.map(p => p.id);
      }
      // Se for admin, buscar todos os profissionais
      else if (userProfile.tipo_usuario === 'admin') {
        const { data: profissionais } = await supabase
          .from('profissionais')
          .select('id')
          .eq('ativo', true);

        if (!profissionais || profissionais.length === 0) return;
        profissionalIds = profissionais.map(p => p.id);
      }

      if (profissionalIds.length === 0) return;

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
            .in('profissional_id', profissionalIds)
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
    if (!user || !userProfile) return;

    try {
      let profissionalIds: string[] = [];

      // Se for profissional, usar apenas seu ID
      if (userProfile.tipo_usuario === 'profissional') {
        const { data: profissional } = await supabase
          .from('profissionais')
          .select('id, clinica_id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle();

        if (!profissional) return;
        profissionalIds = [profissional.id];
      } 
      // Se for recepcionista, buscar profissionais da clínica
      else if (userProfile.tipo_usuario === 'recepcionista') {
        // Buscar clínica do usuário
        const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
        
        if (!clinicasUsuario || clinicasUsuario.length === 0) return;

        const clinicaId = clinicasUsuario[0].clinica_id;

        // Buscar profissionais da clínica
        const { data: profissionais } = await supabase
          .from('profissionais')
          .select('id')
          .eq('clinica_id', clinicaId)
          .eq('ativo', true);

        if (!profissionais || profissionais.length === 0) return;
        profissionalIds = profissionais.map(p => p.id);
      }
      // Se for admin, buscar todos os profissionais
      else if (userProfile.tipo_usuario === 'admin') {
        const { data: profissionais } = await supabase
          .from('profissionais')
          .select('id')
          .eq('ativo', true);

        if (!profissionais || profissionais.length === 0) return;
        profissionalIds = profissionais.map(p => p.id);
      }

      if (profissionalIds.length === 0) return;

      // Buscar receita desde janeiro do ano atual
      const anoAtual = new Date().getFullYear();
      const mesAtual = new Date().getMonth(); // 0-11
      const ultimosMeses = Array.from({ length: mesAtual + 1 }, (_, i) => {
        const data = new Date(anoAtual, i, 1);
        return {
          mes: format(data, 'MMM', { locale: ptBR }),
          inicio: startOfMonth(data),
          fim: endOfMonth(data)
        };
      });

      console.log('Buscando receita mensal para profissionais:', profissionalIds);

      const dadosPorMes = await Promise.all(
        ultimosMeses.map(async ({ mes, inicio, fim }) => {
          console.log(`Buscando receita para ${mes}: ${inicio.toISOString()} - ${fim.toISOString()}`);
          
          // Primeiro buscar agendamentos dos profissionais no período
          const { data: agendamentos } = await supabase
            .from('agendamentos')
            .select('id, status, data_inicio')
            .in('profissional_id', profissionalIds)
            .gte('data_inicio', inicio.toISOString())
            .lte('data_inicio', fim.toISOString());

          if (!agendamentos || agendamentos.length === 0) {
            console.log(`Nenhum agendamento para ${mes}`);
            return { mes, receita: 0, recebido: 0, aReceber: 0, aGanhar: 0, emAtraso: 0 };
          }

          const agendamentoIds = agendamentos.map(a => a.id);
          const agora = new Date();
          
          // Agendamentos realizados (já passaram)
          const agendamentosRealizados = agendamentos.filter(a => 
            new Date(a.data_inicio) < agora && a.status === 'realizado'
          ).map(a => a.id);
          
          // Agendamentos a realizar (ainda não passaram)
          const agendamentosARealizar = agendamentos.filter(a => 
            new Date(a.data_inicio) >= agora && a.status === 'pendente'
          ).map(a => a.id);

          // Buscar todos os pagamentos desses agendamentos
          const { data: pagamentos } = await supabase
            .from('pagamentos')
            .select('valor_pago, valor_total, status, data_vencimento, agendamento_id')
            .in('agendamento_id', agendamentoIds);

          // Total Recebido - pagamentos com status 'pago'
          const recebido = pagamentos?.filter(p => p.status === 'pago')
            .reduce((acc, p) => acc + (Number(p.valor_pago) > 0 ? Number(p.valor_pago) : Number(p.valor_total)), 0) || 0;

          // A Receber - consultas já realizadas mas ainda não pagas
          const aReceber = pagamentos?.filter(p => 
            agendamentosRealizados.includes(p.agendamento_id) && 
            p.status === 'pendente'
          ).reduce((acc, p) => acc + Number(p.valor_total), 0) || 0;

          // A Ganhar - consultas futuras (a realizar)
          const aGanhar = pagamentos?.filter(p => 
            agendamentosARealizar.includes(p.agendamento_id) && 
            p.status === 'pendente'
          ).reduce((acc, p) => acc + Number(p.valor_total), 0) || 0;

          // Em Atraso - pagamentos vencidos
          const emAtraso = pagamentos?.filter(p => 
            p.status === 'vencido' || 
            (p.status === 'pendente' && p.data_vencimento && new Date(p.data_vencimento) < agora)
          ).reduce((acc, p) => acc + Number(p.valor_total), 0) || 0;

          const receita = recebido; // Mantém compatibilidade com código existente
          console.log(`Dados ${mes}:`, { recebido, aReceber, aGanhar, emAtraso });

          return { mes, receita, recebido, aReceber, aGanhar, emAtraso };
        })
      );

      console.log('Dados finais por mês:', dadosPorMes);
      setReceitaPorMes(dadosPorMes);
    } catch (err) {
      console.error('Erro ao buscar receita por mês:', err);
    }
  };

  const buscarTiposConsulta = async () => {
    if (!user || !userProfile) return;

    try {
      let profissionalIds: string[] = [];

      // Se for profissional, usar apenas seu ID
      if (userProfile.tipo_usuario === 'profissional') {
        const { data: profissional } = await supabase
          .from('profissionais')
          .select('id, clinica_id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle();

        if (!profissional) return;
        profissionalIds = [profissional.id];
      } 
      // Se for recepcionista, buscar profissionais da clínica
      else if (userProfile.tipo_usuario === 'recepcionista') {
        // Buscar clínica do usuário
        const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
        
        if (!clinicasUsuario || clinicasUsuario.length === 0) return;

        const clinicaId = clinicasUsuario[0].clinica_id;

        // Buscar profissionais da clínica
        const { data: profissionais } = await supabase
          .from('profissionais')
          .select('id')
          .eq('clinica_id', clinicaId)
          .eq('ativo', true);

        if (!profissionais || profissionais.length === 0) return;
        profissionalIds = profissionais.map(p => p.id);
      }
      // Se for admin, buscar todos os profissionais
      else if (userProfile.tipo_usuario === 'admin') {
        const { data: profissionais } = await supabase
          .from('profissionais')
          .select('id')
          .eq('ativo', true);

        if (!profissionais || profissionais.length === 0) return;
        profissionalIds = profissionais.map(p => p.id);
      }

      if (profissionalIds.length === 0) return;

      const { inicio, fim } = getDateRange(periodo);

      const { data: agendamentos } = await supabase
        .from('agendamentos')
        .select('tipo_servico')
        .in('profissional_id', profissionalIds)
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

  const buscarStatusConsultas = async () => {
    if (!user || !userProfile) return;

    try {
      let profissionalIds: string[] = [];

      if (userProfile.tipo_usuario === 'profissional') {
        const { data: profissional } = await supabase
          .from('profissionais')
          .select('id, clinica_id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle();

        if (!profissional) return;
        profissionalIds = [profissional.id];
      } 
      else if (userProfile.tipo_usuario === 'recepcionista') {
        const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
        
        if (!clinicasUsuario || clinicasUsuario.length === 0) return;

        const clinicaId = clinicasUsuario[0].clinica_id;

        const { data: profissionais } = await supabase
          .from('profissionais')
          .select('id')
          .eq('clinica_id', clinicaId)
          .eq('ativo', true);

        if (!profissionais || profissionais.length === 0) return;
        profissionalIds = profissionais.map(p => p.id);
      }
      else if (userProfile.tipo_usuario === 'admin') {
        const { data: profissionais } = await supabase
          .from('profissionais')
          .select('id')
          .eq('ativo', true);

        if (!profissionais || profissionais.length === 0) return;
        profissionalIds = profissionais.map(p => p.id);
      }

      if (profissionalIds.length === 0) return;

      const { inicio, fim } = getDateRange(periodo);

      const { data: agendamentos } = await supabase
        .from('agendamentos')
        .select('status, desmarcada')
        .in('profissional_id', profissionalIds)
        .gte('data_inicio', inicio.toISOString())
        .lte('data_inicio', fim.toISOString());

      const pendentes = agendamentos?.filter(a => a.status === 'pendente' && !a.desmarcada).length || 0;
      const realizadas = agendamentos?.filter(a => a.status === 'realizado').length || 0;
      const desmarcadas = agendamentos?.filter(a => a.desmarcada === true).length || 0;

      const total = pendentes + realizadas + desmarcadas;

      setStatusConsultas([
        {
          nome: 'Pendentes',
          valor: pendentes,
          cor: 'hsl(var(--warning))'
        },
        {
          nome: 'Realizadas',
          valor: realizadas,
          cor: 'hsl(var(--success))'
        },
        {
          nome: 'Desmarcadas',
          valor: desmarcadas,
          cor: 'hsl(var(--destructive))'
        }
      ]);
    } catch (err) {
      console.error('Erro ao buscar status de consultas:', err);
    }
  };

  const buscarStatusPagamentos = async () => {
    if (!user || !userProfile) return;

    try {
      let profissionalIds: string[] = [];

      if (userProfile.tipo_usuario === 'profissional') {
        const { data: profissional } = await supabase
          .from('profissionais')
          .select('id, clinica_id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle();

        if (!profissional) return;
        profissionalIds = [profissional.id];
      } 
      else if (userProfile.tipo_usuario === 'recepcionista') {
        const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
        
        if (!clinicasUsuario || clinicasUsuario.length === 0) return;

        const clinicaId = clinicasUsuario[0].clinica_id;

        const { data: profissionais } = await supabase
          .from('profissionais')
          .select('id')
          .eq('clinica_id', clinicaId)
          .eq('ativo', true);

        if (!profissionais || profissionais.length === 0) return;
        profissionalIds = profissionais.map(p => p.id);
      }
      else if (userProfile.tipo_usuario === 'admin') {
        const { data: profissionais } = await supabase
          .from('profissionais')
          .select('id')
          .eq('ativo', true);

        if (!profissionais || profissionais.length === 0) return;
        profissionalIds = profissionais.map(p => p.id);
      }

      if (profissionalIds.length === 0) return;

      const { inicio, fim } = getDateRange(periodo);

      // Buscar agendamentos do período primeiro
      const { data: agendamentos } = await supabase
        .from('agendamentos')
        .select('id')
        .in('profissional_id', profissionalIds)
        .gte('data_inicio', inicio.toISOString())
        .lte('data_inicio', fim.toISOString());

      if (!agendamentos || agendamentos.length === 0) {
        setStatusPagamentos([
          { nome: 'Pendentes', valor: 0, cor: 'hsl(45, 93%, 60%)' },
          { nome: 'A Receber', valor: 0, cor: 'hsl(221, 83%, 53%)' },
          { nome: 'Recebidos', valor: 0, cor: 'hsl(142, 76%, 36%)' }
        ]);
        return;
      }

      const agendamentoIds = agendamentos.map(a => a.id);

      // Buscar pagamentos desses agendamentos
      const { data: pagamentos } = await supabase
        .from('pagamentos')
        .select('status, valor_total')
        .in('agendamento_id', agendamentoIds);

      const pendentes = pagamentos?.filter(p => p.status === 'pendente').reduce((acc, p) => acc + Number(p.valor_total), 0) || 0;
      const vencidos = pagamentos?.filter(p => p.status === 'vencido').reduce((acc, p) => acc + Number(p.valor_total), 0) || 0;
      const pagos = pagamentos?.filter(p => p.status === 'pago').reduce((acc, p) => acc + Number(p.valor_total), 0) || 0;

      setStatusPagamentos([
        {
          nome: 'Pendentes',
          valor: pendentes,
          cor: 'hsl(var(--warning))'
        },
        {
          nome: 'A Receber',
          valor: vencidos,
          cor: 'hsl(var(--info))'
        },
        {
          nome: 'Recebidos',
          valor: pagos,
          cor: 'hsl(var(--success))'
        }
      ]);
    } catch (err) {
      console.error('Erro ao buscar status de pagamentos:', err);
    }
  };

  const buscarNovosPacientesPorMes = async () => {
    if (!user || !userProfile) return;

    try {
      let clinicaId: string | null = null;

      if (userProfile.tipo_usuario === 'profissional') {
        const { data: profissional } = await supabase
          .from('profissionais')
          .select('clinica_id')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .maybeSingle();

        if (!profissional) return;
        clinicaId = profissional.clinica_id;
      } 
      else if (userProfile.tipo_usuario === 'recepcionista') {
        const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
        
        if (!clinicasUsuario || clinicasUsuario.length === 0) return;
        clinicaId = clinicasUsuario[0].clinica_id;
      }
      else if (userProfile.tipo_usuario === 'admin') {
        // Admin vê todos os pacientes
        clinicaId = null;
      }

      // Buscar novos pacientes desde janeiro do ano atual
      const anoAtual = new Date().getFullYear();
      const mesAtual = new Date().getMonth(); // 0-11
      const ultimosMeses = Array.from({ length: mesAtual + 1 }, (_, i) => {
        const data = new Date(anoAtual, i, 1);
        return {
          mes: format(data, 'MMM', { locale: ptBR }),
          inicio: startOfMonth(data),
          fim: endOfMonth(data)
        };
      });

      const dadosPorMes = await Promise.all(
        ultimosMeses.map(async ({ mes, inicio, fim }) => {
          let query = supabase
            .from('pacientes')
            .select('id', { count: 'exact' })
            .gte('criado_em', inicio.toISOString())
            .lte('criado_em', fim.toISOString());

          if (clinicaId) {
            query = query.eq('clinica_id', clinicaId);
          }

          const { count } = await query;

          return {
            mes,
            pacientes: count || 0
          };
        })
      );

      setNovosPacientesPorMes(dadosPorMes);
    } catch (err) {
      console.error('Erro ao buscar novos pacientes por mês:', err);
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
        buscarNovosPacientesPorMes(),
        buscarTiposConsulta(),
        buscarStatusConsultas(),
        buscarStatusPagamentos()
      ]);

      setLoading(false);
    };

    if (user && userProfile) {
      carregarDados();
    }
  }, [user, userProfile, periodo]);

  return {
    loading,
    error,
    estatisticas,
    consultasPorDia,
    receitaPorMes,
    novosPacientesPorMes,
    tiposConsulta,
    statusConsultas,
    statusPagamentos
  };
};