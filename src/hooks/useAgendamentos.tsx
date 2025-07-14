import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Agendamento = Tables<'agendamentos'>;
type InsertAgendamento = Omit<Agendamento, 'id' | 'criado_em' | 'atualizado_em'>;
type UpdateAgendamento = Partial<InsertAgendamento>;

export function useAgendamentos() {
  return useQuery({
    queryKey: ['agendamentos'],
    queryFn: async () => {
      // Buscar clínicas do usuário
      const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
      
      if (!clinicasUsuario || clinicasUsuario.length === 0) {
        return [];
      }

      // Filtrar agendamentos pelos profissionais das clínicas do usuário
      const clinicaIds = clinicasUsuario.map(c => c.clinica_id);

      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          pacientes(id, nome, telefone, email),
          profissionais!inner(id, nome, especialidade, clinica_id)
        `)
        .in('profissionais.clinica_id', clinicaIds)
        .order('data_inicio', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAgendamentosHoje() {
  return useQuery({
    queryKey: ['agendamentos-hoje'],
    queryFn: async () => {
      // Buscar clínicas do usuário
      const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
      
      if (!clinicasUsuario || clinicasUsuario.length === 0) {
        return [];
      }

      const clinicaIds = clinicasUsuario.map(c => c.clinica_id);
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          pacientes(id, nome, telefone, email),
          profissionais!inner(id, nome, especialidade, clinica_id)
        `)
        .in('profissionais.clinica_id', clinicaIds)
        .gte('data_inicio', `${hoje}T00:00:00`)
        .lt('data_inicio', `${hoje}T23:59:59`)
        .order('data_inicio', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useProximosAgendamentos(limit = 5) {
  return useQuery({
    queryKey: ['proximos-agendamentos', limit],
    queryFn: async () => {
      // Buscar profissional atual
      const { data: profissionalId } = await supabase.rpc('get_current_profissional_id');
      
      if (!profissionalId) {
        return [];
      }

      const agora = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          pacientes(id, nome, telefone, email),
          profissionais(id, nome, especialidade)
        `)
        .eq('profissional_id', profissionalId)
        .gte('data_inicio', agora)
        .order('data_inicio', { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateAgendamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (agendamento: InsertAgendamento) => {
      console.log('Dados do agendamento a ser criado:', agendamento);
      
      // Validações básicas
      if (!agendamento.paciente_id || !agendamento.profissional_id || !agendamento.data_inicio) {
        throw new Error('Dados obrigatórios ausentes: ' + JSON.stringify({
          paciente_id: !!agendamento.paciente_id,
          profissional_id: !!agendamento.profissional_id,
          data_inicio: !!agendamento.data_inicio
        }));
      }

      // Verificar se o profissional existe e está ativo
      const { data: profissionalVerif, error: profError } = await supabase
        .from('profissionais')
        .select('id, ativo')
        .eq('id', agendamento.profissional_id)
        .eq('ativo', true)
        .single();

      if (profError || !profissionalVerif) {
        throw new Error('Profissional não encontrado ou inativo');
      }

      // Verificar conflito de horário
      const { data: conflito, error: conflitoError } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('profissional_id', agendamento.profissional_id)
        .gte('data_inicio', agendamento.data_inicio)
        .lt('data_inicio', agendamento.data_fim);

      if (conflitoError) throw conflitoError;
      
      if (conflito && conflito.length > 0) {
        throw new Error('Já existe um agendamento neste horário para este profissional');
      }

      const { data, error } = await supabase
        .from('agendamentos')
        .insert(agendamento)
        .select(`
          *,
          pacientes(id, nome, telefone, email),
          profissionais(id, nome, especialidade)
        `)
        .single();
      
      if (error) throw error;

      // Criar evento no Google Calendar
      try {
        await supabase.functions.invoke('google-calendar', {
          body: {
            action: 'create',
            agendamentoId: data.id,
          },
        });
      } catch (calendarError) {
        console.warn('Erro ao criar evento no Google Calendar:', calendarError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-hoje'] });
      queryClient.invalidateQueries({ queryKey: ['proximos-agendamentos'] });
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro detalhado ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento: ' + error.message);
    },
  });
}

export function useUpdateAgendamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAgendamento }) => {
      const { data: updated, error } = await supabase
        .from('agendamentos')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          pacientes(id, nome, telefone, email),
          profissionais(id, nome, especialidade)
        `)
        .single();
      
      if (error) throw error;

      // Atualizar evento no Google Calendar
      try {
        await supabase.functions.invoke('google-calendar', {
          body: {
            action: 'update',
            agendamentoId: id,
          },
        });
      } catch (calendarError) {
        console.warn('Erro ao atualizar evento no Google Calendar:', calendarError);
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-hoje'] });
      queryClient.invalidateQueries({ queryKey: ['proximos-agendamentos'] });
      toast.success('Agendamento atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar agendamento: ' + error.message);
    },
  });
}

export function useConfirmarAgendamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('agendamentos')
        .update({ status: 'confirmado' })
        .eq('id', id)
        .select(`
          *,
          pacientes(id, nome, telefone, email),
          profissionais(id, nome, especialidade)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-hoje'] });
      queryClient.invalidateQueries({ queryKey: ['proximos-agendamentos'] });
      toast.success('Agendamento confirmado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao confirmar agendamento: ' + error.message);
    },
  });
}

export function useDesmarcarAgendamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('agendamentos')
        .update({ desmarcada: true })
        .eq('id', id)
        .select(`
          *,
          pacientes(id, nome, telefone, email),
          profissionais(id, nome, especialidade)
        `)
        .single();
      
      if (error) throw error;

      // Excluir evento do Google Calendar
      try {
        await supabase.functions.invoke('google-calendar', {
          body: {
            action: 'delete',
            agendamentoId: id,
          },
        });
      } catch (calendarError) {
        console.warn('Erro ao excluir evento no Google Calendar:', calendarError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-hoje'] });
      queryClient.invalidateQueries({ queryKey: ['proximos-agendamentos'] });
      toast.success('Agendamento desmarcado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao desmarcar agendamento: ' + error.message);
    },
  });
}

export function useAgendamentosStats() {
  return useQuery({
    queryKey: ['agendamentos-stats'],
    queryFn: async () => {
      // Buscar clínicas do usuário
      const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
      
      if (!clinicasUsuario || clinicasUsuario.length === 0) {
        return {
          consultasHoje: 0,
          confirmadasHoje: 0,
          pendentes: 0,
        };
      }

      const clinicaIds = clinicasUsuario.map(c => c.clinica_id);
      const hoje = new Date().toISOString().split('T')[0];
      
      // Consultas hoje
      const { data: consultasHoje, error: hojeError } = await supabase
        .from('agendamentos')
        .select(`
          status, 
          confirmado_pelo_paciente,
          profissionais!inner(clinica_id)
        `)
        .in('profissionais.clinica_id', clinicaIds)
        .gte('data_inicio', `${hoje}T00:00:00`)
        .lt('data_inicio', `${hoje}T23:59:59`);
      
      if (hojeError) throw hojeError;

      // Consultas pendentes (geral)
      const { count: pendentes, error: pendentesError } = await supabase
        .from('agendamentos')
        .select(`
          *,
          profissionais!inner(clinica_id)
        `, { count: 'exact', head: true })
        .in('profissionais.clinica_id', clinicaIds)
        .eq('status', 'pendente');
      
      if (pendentesError) throw pendentesError;

      const totalHoje = consultasHoje?.length || 0;
      const confirmadasHoje = consultasHoje?.filter(c => c.confirmado_pelo_paciente === true).length || 0;

      return {
        consultasHoje: totalHoje,
        confirmadasHoje,
        pendentes: pendentes || 0,
      };
    },
  });
}
