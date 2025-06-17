
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Paciente = Tables<'pacientes'>;
type PacienteInsert = TablesInsert<'pacientes'>;
type PacienteUpdate = TablesUpdate<'pacientes'>;

export function usePacientes() {
  return useQuery({
    queryKey: ['pacientes'],
    queryFn: async (): Promise<Paciente[]> => {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data || [];
    },
  });
}

export function usePaciente(id: string) {
  return useQuery({
    queryKey: ['paciente', id],
    queryFn: async (): Promise<Paciente | null> => {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paciente: PacienteInsert): Promise<Paciente> => {
      const { data, error } = await supabase
        .from('pacientes')
        .insert(paciente)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Paciente criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar paciente: ' + error.message);
    },
  });
}

export function useUpdatePaciente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: PacienteUpdate & { id: string }): Promise<Paciente> => {
      const { data, error } = await supabase
        .from('pacientes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['paciente', data.id] });
      toast.success('Paciente atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar paciente: ' + error.message);
    },
  });
}
