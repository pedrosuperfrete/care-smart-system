import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePacientesComAgendamentos() {
  return useQuery({
    queryKey: ['pacientes-com-agendamentos'],
    queryFn: async () => {
      // Buscar todos os pacientes únicos que têm pelo menos um agendamento
      const { data, error } = await supabase
        .from('agendamentos')
        .select('paciente_id');

      if (error) throw error;

      // Retornar um Set de IDs de pacientes que têm agendamentos
      return new Set(data?.map(a => a.paciente_id) || []);
    },
  });
}
