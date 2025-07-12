
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Prontuario = Tables<'prontuarios'>;
type InsertProntuario = Omit<Prontuario, 'id' | 'criado_em' | 'ultima_edicao'>;
type UpdateProntuario = Partial<InsertProntuario>;

export function useProntuarios() {
  return useQuery({
    queryKey: ['prontuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prontuarios')
        .select(`
          *,
          pacientes(id, nome, email, telefone),
          profissionais(id, nome, especialidade),
          agendamentos(id, data_inicio, tipo_servico)
        `)
        .order('ultima_edicao', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useProntuario(prontuarioId: string) {
  return useQuery({
    queryKey: ['prontuario', prontuarioId],
    queryFn: async () => {
      if (!prontuarioId) return null;
      
      const { data, error } = await supabase
        .from('prontuarios')
        .select(`
          *,
          pacientes(id, nome, email, telefone),
          profissionais(id, nome, especialidade),
          agendamentos(id, data_inicio, tipo_servico)
        `)
        .eq('id', prontuarioId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!prontuarioId,
  });
}

export function useProntuariosPorPaciente(pacienteId: string) {
  return useQuery({
    queryKey: ['prontuarios', 'paciente', pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prontuarios')
        .select(`
          *,
          profissionais(id, nome, especialidade),
          agendamentos(id, data_inicio, tipo_servico)
        `)
        .eq('paciente_id', pacienteId)
        .order('ultima_edicao', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!pacienteId,
  });
}

export function useCreateProntuario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (prontuario: InsertProntuario) => {
      const { data, error } = await supabase
        .from('prontuarios')
        .insert(prontuario)
        .select(`
          *,
          pacientes(id, nome, email, telefone),
          profissionais(id, nome, especialidade),
          agendamentos(id, data_inicio, tipo_servico)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prontuarios'] });
      toast.success('Prontuário criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar prontuário: ' + error.message);
    },
  });
}

export function useUpdateProntuario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProntuario }) => {
      const { data: updated, error } = await supabase
        .from('prontuarios')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          pacientes(id, nome, email, telefone),
          profissionais(id, nome, especialidade),
          agendamentos(id, data_inicio, tipo_servico)
        `)
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prontuarios'] });
      toast.success('Prontuário atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar prontuário: ' + error.message);
    },
  });
}

export function useModelosProntuarios() {
  return useQuery({
    queryKey: ['modelos-prontuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modelos_prontuarios')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: { nome: string; conteudo: string; especialidade?: string }) => {
      const { data, error } = await supabase
        .from('modelos_prontuarios')
        .insert(template)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-prontuarios'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar template: ' + error.message);
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { nome?: string; conteudo?: string; especialidade?: string } }) => {
      const { data: updated, error } = await supabase
        .from('modelos_prontuarios')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-prontuarios'] });
      toast.success('Template atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar template: ' + error.message);
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('modelos_prontuarios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-prontuarios'] });
      toast.success('Template excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir template: ' + error.message);
    },
  });
}
