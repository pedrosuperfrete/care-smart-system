
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Agendamento = Tables<'agendamentos'>;
type AgendamentoInsert = TablesInsert<'agendamentos'>;
type AgendamentoUpdate = TablesUpdate<'agendamentos'>;

export function useAgendamentos() {
  return useQuery({
    queryKey: ['agendamentos'],
    queryFn: async (): Promise<Agendamento[]> => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          pacientes!inner(nome, telefone),
          profissionais!inner(nome, especialidade)
        `)
        .order('data_inicio');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAgendamento(id: string) {
  return useQuery({
    queryKey: ['agendamento', id],
    queryFn: async (): Promise<Agendamento | null> => {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          pacientes!inner(nome, telefone, email),
          profissionais!inner(nome, especialidade)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateAgendamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agendamento: AgendamentoInsert): Promise<Agendamento> => {
      const { data, error } = await supabase
        .from('agendamentos')
        .insert(agendamento)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar agendamento: ' + error.message);
    },
  });
}

export function useUpdateAgendamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: AgendamentoUpdate & { id: string }): Promise<Agendamento> => {
      const { data, error } = await supabase
        .from('agendamentos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['agendamento', data.id] });
      toast.success('Agendamento atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar agendamento: ' + error.message);
    },
  });
}
