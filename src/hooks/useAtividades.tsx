
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAtividadesRecentes(limit = 5) {
  return useQuery({
    queryKey: ['atividades-recentes', limit],
    queryFn: async () => {
      // Buscar atividades recentes de diferentes tabelas
      const atividades: Array<{
        id: string;
        tipo: 'paciente' | 'agendamento' | 'pagamento';
        descricao: string;
        data: string;
        icone: string;
      }> = [];

      // Pacientes recentes
      const { data: pacientesRecentes } = await supabase
        .from('pacientes')
        .select('id, nome, criado_em')
        .order('criado_em', { ascending: false })
        .limit(3);

      pacientesRecentes?.forEach(paciente => {
        const tempoDecorrido = getTempoDecorrido(paciente.criado_em);
        atividades.push({
          id: `paciente-${paciente.id}`,
          tipo: 'paciente',
          descricao: `Novo paciente cadastrado: ${paciente.nome}`,
          data: tempoDecorrido,
          icone: '👤',
        });
      });

      // Agendamentos confirmados recentes
      const { data: agendamentosRecentes } = await supabase
        .from('agendamentos')
        .select(`
          id, confirmado_pelo_paciente, atualizado_em,
          pacientes(nome)
        `)
        .eq('confirmado_pelo_paciente', true)
        .order('atualizado_em', { ascending: false })
        .limit(3);

      agendamentosRecentes?.forEach(agendamento => {
        const tempoDecorrido = getTempoDecorrido(agendamento.atualizado_em);
        atividades.push({
          id: `agendamento-${agendamento.id}`,
          tipo: 'agendamento',
          descricao: `Consulta confirmada: ${(agendamento as any).pacientes?.nome}`,
          data: tempoDecorrido,
          icone: '✅',
        });
      });

      // Pagamentos recentes
      const { data: pagamentosRecentes } = await supabase
        .from('pagamentos')
        .select(`
          id, data_pagamento, valor_pago,
          agendamentos(
            pacientes(nome)
          )
        `)
        .eq('status', 'pago')
        .order('data_pagamento', { ascending: false })
        .limit(2);

      pagamentosRecentes?.forEach(pagamento => {
        if (pagamento.data_pagamento) {
          const tempoDecorrido = getTempoDecorrido(pagamento.data_pagamento);
          const pacienteNome = (pagamento as any).agendamentos?.pacientes?.nome;
          const valor = Number(pagamento.valor_pago).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          });
          atividades.push({
            id: `pagamento-${pagamento.id}`,
            tipo: 'pagamento',
            descricao: `Pagamento recebido: ${pacienteNome} - ${valor}`,
            data: tempoDecorrido,
            icone: '💰',
          });
        }
      });

      // Ordenar por data e limitar
      return atividades
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
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
