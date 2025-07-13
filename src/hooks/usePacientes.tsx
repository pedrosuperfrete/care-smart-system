
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Paciente = Tables<'pacientes'>;
type InsertPaciente = Omit<Paciente, 'id' | 'criado_em' | 'atualizado_em'>;
type UpdatePaciente = Partial<InsertPaciente>;

export function usePacientes() {
  return useQuery({
    queryKey: ['pacientes'],
    queryFn: async () => {
      // Buscar clínicas do usuário
      const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
      console.log('Clínicas do usuário na query de pacientes:', clinicasUsuario);
      
      if (!clinicasUsuario || clinicasUsuario.length === 0) {
        console.log('Usuário não tem clínicas associadas');
        return [];
      }

      // Filtrar pacientes pelas clínicas do usuário
      const clinicaIds = clinicasUsuario.map(c => c.clinica_id);
      
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .in('clinica_id', clinicaIds)
        .eq('ativo', true)
        .order('criado_em', { ascending: false });
      
      console.log('Pacientes filtrados por clínica:', data);
      if (error) {
        console.error('Erro ao buscar pacientes:', error);
        throw error;
      }
      return data || [];
    },
  });
}

export function usePaciente(id: string) {
  return useQuery({
    queryKey: ['paciente', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePaciente() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paciente: InsertPaciente) => {
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
      toast.success('Paciente cadastrado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao cadastrar paciente: ' + error.message);
    },
  });
}

export function useUpdatePaciente() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePaciente }) => {
      const { data: updated, error } = await supabase
        .from('pacientes')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Paciente atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar paciente: ' + error.message);
    },
  });
}

export function usePacientesStats() {
  return useQuery({
    queryKey: ['pacientes-stats'],
    queryFn: async () => {
      // Buscar clínicas do usuário
      const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
      
      if (!clinicasUsuario || clinicasUsuario.length === 0) {
        return {
          total: 0,
          adimplentes: 0,
          inadimplentes: 0,
        };
      }

      // Filtrar pacientes pelas clínicas do usuário
      const clinicaIds = clinicasUsuario.map(c => c.clinica_id);

      const { count: total, error: totalError } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .in('clinica_id', clinicaIds)
        .eq('ativo', true);

      if (totalError) throw totalError;

      // Calcular adimplentes vs inadimplentes baseado em pagamentos
      const { data: pacientesComPagamentos, error: pagamentosError } = await supabase
        .from('pacientes')
        .select(`
          id,
          nome,
          agendamentos!inner(
            id,
            pagamentos!fk_pagamento_agendamento(status)
          )
        `)
        .in('clinica_id', clinicaIds)
        .eq('ativo', true);

      if (pagamentosError) throw pagamentosError;

      // Contar adimplentes (pacientes sem pagamentos pendentes)
      const adimplentes = pacientesComPagamentos?.filter(paciente => {
        const pagamentosPendentes = paciente.agendamentos.some((ag: any) => 
          ag.pagamentos?.some((p: any) => p.status === 'pendente')
        );
        return !pagamentosPendentes;
      }).length || 0;

      return {
        total: total || 0,
        adimplentes,
        inadimplentes: (total || 0) - adimplentes,
      };
    },
  });
}
