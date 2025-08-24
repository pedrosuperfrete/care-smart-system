
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useErrorLogger } from './useErrorLogger';

type Paciente = Tables<'pacientes'>;
type InsertPaciente = Omit<Paciente, 'id' | 'criado_em' | 'atualizado_em'>;
type UpdatePaciente = Partial<InsertPaciente>;

export function usePacientes() {
  const { logSupabaseError } = useErrorLogger();
  
  return useQuery({
    queryKey: ['pacientes'],
    queryFn: async () => {
      try {
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
          await logSupabaseError('buscar_pacientes', error, { clinicaIds });
          throw error;
        }
        return data || [];
      } catch (error: any) {
        await logSupabaseError('buscar_pacientes_catch', error);
        throw error;
      }
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
  const { logSupabaseError, logCustomError } = useErrorLogger();
  
  return useMutation({
    mutationFn: async (paciente: InsertPaciente & { verificarLimite?: boolean }) => {
      try {
        // Verificar limite se solicitado
        if (paciente.verificarLimite) {
          // Usar a função can_create_patient que já faz toda a verificação
          const { data: podeCrear, error: canCreateError } = await supabase.rpc('can_create_patient');
          
          if (canCreateError) {
            await logSupabaseError('verificar_can_create_patient', canCreateError);
            throw canCreateError;
          }

          if (!podeCrear) {
            await logCustomError('LIMITE_PACIENTES_ATINGIDO', 'Limite de pacientes atingido');
            throw new Error("LIMITE_ATINGIDO");
          }
        }

        // Remover campo de verificação antes de inserir e garantir que tenha clinica_id
        const { verificarLimite, ...pacienteDataBase } = paciente;
        
        // Se não tem clinica_id, pegar da primeira clínica do usuário
        let pacienteData = { ...pacienteDataBase };
        if (!pacienteData.clinica_id) {
          const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
          if (clinicasUsuario && clinicasUsuario.length > 0) {
            pacienteData.clinica_id = clinicasUsuario[0].clinica_id;
          } else {
            throw new Error("Usuário não tem clínica associada");
          }
        }
        
        const { data, error } = await supabase
          .from('pacientes')
          .insert(pacienteData)
          .select()
          .single();
        
        if (error) {
          await logSupabaseError('inserir_paciente', error, { pacienteData });
          throw error;
        }
        
        return data;
      } catch (error: any) {
        // Log do erro se ainda não foi logado
        if (error.message !== "LIMITE_ATINGIDO") {
          await logCustomError('PACIENTE_CREATE_ERROR', error.message, { paciente });
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['limite-pacientes'] });
      toast.success('Paciente cadastrado com sucesso!');
    },
    onError: (error: any) => {
      if (error.message === "LIMITE_ATINGIDO") {
        // Não mostrar toast aqui, será tratado no componente
        throw error;
      }
      toast.error('Erro ao cadastrar paciente: ' + error.message);
    },
  });
}

export function useUpdatePaciente() {
  const queryClient = useQueryClient();
  const { logSupabaseError } = useErrorLogger();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePaciente }) => {
      try {
        console.log('Tentando atualizar paciente:', { id, data });
        
        // Primeiro, verificar se o paciente existe e se temos permissão para vê-lo
        const { data: existingPaciente, error: findError } = await supabase
          .from('pacientes')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (findError) {
          console.error('Erro ao buscar paciente antes da atualização:', findError);
          await logSupabaseError('buscar_paciente_antes_update', findError, { id });
          throw findError;
        }
        
        if (!existingPaciente) {
          const error = new Error('Paciente não encontrado ou sem permissão de acesso');
          console.error('Paciente não encontrado:', id);
          await logSupabaseError('paciente_nao_encontrado_update', error, { id });
          throw error;
        }
        
        console.log('Paciente encontrado:', existingPaciente);
        
        // Realizar a atualização
        const { data: updated, error } = await supabase
          .from('pacientes')
          .update(data)
          .eq('id', id)
          .select()
          .maybeSingle();
        
        if (error) {
          console.error('Erro na atualização:', error);
          await logSupabaseError('update_paciente', error, { id, data });
          throw error;
        }
        
        if (!updated) {
          const error = new Error('Nenhuma linha foi atualizada - verifique as permissões RLS');
          console.error('Update não retornou dados:', { id, data });
          await logSupabaseError('update_sem_retorno', error, { id, data });
          throw error;
        }
        
        console.log('Paciente atualizado com sucesso:', updated);
        return updated;
      } catch (error: any) {
        console.error('Erro completo na atualização:', error);
        await logSupabaseError('update_paciente_catch', error, { id, data });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['paciente'] });
      toast.success('Paciente atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro no onError:', error);
      toast.error('Erro ao salvar paciente: ' + error.message);
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

      // Contar pacientes adimplentes e inadimplentes usando a coluna direta
      const { count: inadimplentes, error: inadimplentesError } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .in('clinica_id', clinicaIds)
        .eq('ativo', true)
        .eq('inadimplente', true);

      if (inadimplentesError) throw inadimplentesError;

      const adimplentes = (total || 0) - (inadimplentes || 0);

      return {
        total: total || 0,
        adimplentes,
        inadimplentes: inadimplentes || 0,
      };
    },
  });
}
