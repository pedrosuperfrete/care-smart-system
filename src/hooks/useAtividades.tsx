
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAtividadesRecentes(limit = 5) {
  return useQuery({
    queryKey: ['atividades-recentes', limit],
    queryFn: async () => {
      // Buscar profissional atual
      const { data: profissionalId } = await supabase.rpc('get_current_profissional_id');
      
      if (!profissionalId) {
        return [];
      }

      // Buscar clínica do profissional
      const { data: profissional } = await supabase
        .from('profissionais')
        .select('clinica_id')
        .eq('id', profissionalId)
        .single();

      if (!profissional?.clinica_id) {
        return [];
      }

      // Buscar atividades recentes de diferentes tabelas
      const atividades: Array<{
        id: string;
        entityId: string;
        tipo: 'paciente' | 'agendamento' | 'pagamento';
        descricao: string;
        data: string;
        icone: string;
        timestamp: number;
      }> = [];

      // Pacientes recentes da clínica
      const { data: pacientesRecentes } = await supabase
        .from('pacientes')
        .select('id, nome, criado_em')
        .eq('clinica_id', profissional.clinica_id)
        .order('criado_em', { ascending: false })
        .limit(3);

      pacientesRecentes?.forEach(paciente => {
        const tempoDecorrido = getTempoDecorrido(paciente.criado_em);
        const timestamp = new Date(paciente.criado_em).getTime();
        atividades.push({
          id: `paciente-${paciente.id}`,
          entityId: paciente.id,
          tipo: 'paciente',
          descricao: `Novo paciente cadastrado: ${paciente.nome}`,
          data: tempoDecorrido,
          icone: '👤',
          timestamp,
        });
      });

      // Agendamentos recentes do profissional (criados, editados, confirmados, desmarcados)
      const { data: agendamentosRecentes } = await supabase
        .from('agendamentos')
        .select(`
          id, confirmado_pelo_paciente, atualizado_em, criado_em, desmarcada, status, servicos_adicionais,
          pacientes(nome)
        `)
        .eq('profissional_id', profissionalId)
        .order('atualizado_em', { ascending: false })
        .limit(5);

      agendamentosRecentes?.forEach(agendamento => {
        const tempoDecorrido = getTempoDecorrido(agendamento.atualizado_em);
        const timestamp = new Date(agendamento.atualizado_em).getTime();
        const pacienteNome = (agendamento as any).pacientes?.nome;
        
        // Verificar se foi criado recentemente (menos de 2 horas)
        const criadoRecentemente = new Date().getTime() - new Date(agendamento.criado_em).getTime() < 2 * 60 * 60 * 1000;
        const editadoRecentemente = agendamento.criado_em !== agendamento.atualizado_em;
        
        // Verificar serviços adicionais
        const servicosAdicionais = agendamento.servicos_adicionais as Array<{ nome: string; valor: number }> | null;
        if (servicosAdicionais && servicosAdicionais.length > 0) {
          const nomesServicos = servicosAdicionais.map(s => s.nome).join(', ');
          atividades.push({
            id: `servico-adicional-${agendamento.id}`,
            entityId: agendamento.id,
            tipo: 'agendamento',
            descricao: `Serviço adicional: ${nomesServicos} - ${pacienteNome}`,
            data: tempoDecorrido,
            icone: '➕',
            timestamp,
          });
        }
        
        if (agendamento.desmarcada) {
          atividades.push({
            id: `agendamento-desmarcado-${agendamento.id}`,
            entityId: agendamento.id,
            tipo: 'agendamento',
            descricao: `Consulta desmarcada: ${pacienteNome}`,
            data: tempoDecorrido,
            icone: '❌',
            timestamp,
          });
        } else if (agendamento.confirmado_pelo_paciente) {
          atividades.push({
            id: `agendamento-confirmado-${agendamento.id}`,
            entityId: agendamento.id,
            tipo: 'agendamento',
            descricao: `Consulta confirmada: ${pacienteNome}`,
            data: tempoDecorrido,
            icone: '✅',
            timestamp,
          });
        } else if (editadoRecentemente && !criadoRecentemente && !(servicosAdicionais && servicosAdicionais.length > 0)) {
          atividades.push({
            id: `agendamento-editado-${agendamento.id}`,
            entityId: agendamento.id,
            tipo: 'agendamento',
            descricao: `Consulta editada: ${pacienteNome}`,
            data: tempoDecorrido,
            icone: '✏️',
            timestamp,
          });
        } else if (criadoRecentemente) {
          atividades.push({
            id: `agendamento-criado-${agendamento.id}`,
            entityId: agendamento.id,
            tipo: 'agendamento',
            descricao: `Nova consulta agendada: ${pacienteNome}`,
            data: tempoDecorrido,
            icone: '📅',
            timestamp,
          });
        }
      });

      // Pagamentos recentes do profissional
      const { data: agendamentosProfissional } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('profissional_id', profissionalId);

      if (agendamentosProfissional && agendamentosProfissional.length > 0) {
        const agendamentoIds = agendamentosProfissional.map(a => a.id);
        
        const { data: pagamentosRecentes } = await supabase
          .from('pagamentos')
          .select(`
            id, data_pagamento, valor_pago, agendamento_id,
            agendamentos!fk_pagamento_agendamento(
              pacientes(nome)
            )
          `)
          .in('agendamento_id', agendamentoIds)
          .eq('status', 'pago')
          .order('data_pagamento', { ascending: false })
          .limit(2);

        pagamentosRecentes?.forEach(pagamento => {
          if (pagamento.data_pagamento) {
            const tempoDecorrido = getTempoDecorrido(pagamento.data_pagamento);
            const timestamp = new Date(pagamento.data_pagamento).getTime();
            const pacienteNome = (pagamento as any).agendamentos?.pacientes?.nome;
            const valor = Number(pagamento.valor_pago).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            });
            atividades.push({
              id: `pagamento-${pagamento.id}`,
              entityId: pagamento.agendamento_id,
              tipo: 'pagamento',
              descricao: `Pagamento recebido: ${pacienteNome} - ${valor}`,
              data: tempoDecorrido,
              icone: '💰',
              timestamp,
            });
          }
        });
      }

      // Ordenar por timestamp (mais recente primeiro) e limitar
      return atividades
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    },
  });
}

function getTempoDecorrido(dataString: string): string {
  const agora = new Date();
  const data = new Date(dataString);
  const diffMs = agora.getTime() - data.getTime();
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDias = Math.floor(diffHoras / 24);

  if (diffDias > 0) {
    return `há ${diffDias} dia${diffDias > 1 ? 's' : ''}`;
  } else if (diffHoras > 0) {
    return `há ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
  } else {
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    return `há ${diffMinutos || 1} minuto${diffMinutos > 1 ? 's' : ''}`;
  }
}
