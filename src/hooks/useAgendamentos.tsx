import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { getStartOfDayLocal, getEndOfDayLocal } from '@/lib/dateUtils';

type Agendamento = Tables<'agendamentos'>;
type InsertAgendamento = Omit<Agendamento, 'id' | 'criado_em' | 'atualizado_em'> & {
  origem?: string;
};
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
      const hoje = new Date();
      const inicioHoje = getStartOfDayLocal(hoje).toISOString();
      const fimHoje = getEndOfDayLocal(hoje).toISOString();
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          pacientes(id, nome, telefone, email),
          profissionais!inner(id, nome, especialidade, clinica_id)
        `)
        .in('profissionais.clinica_id', clinicaIds)
        .gte('data_inicio', inicioHoje)
        .lt('data_inicio', fimHoje)
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
      const agora = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          pacientes(id, nome, telefone, email),
          profissionais(id, nome, especialidade, clinica_id)
        `)
        .eq('desmarcada', false)
        .in('status', ['pendente', 'confirmado'])
        .gte('data_inicio', agora)
        .order('data_inicio', { ascending: true })
        .limit(limit);

      if (error) throw error;
      
      // Filtrar apenas agendamentos das clínicas do usuário
      if (!data) return [];
      
      const { data: userClinicas } = await supabase.rpc('get_user_clinicas');
      const clinicasIds = userClinicas?.map((uc: any) => uc.clinica_id) || [];
      
      const agendamentosFiltrados = data.filter((agendamento: any) => 
        clinicasIds.includes(agendamento.profissionais?.clinica_id)
      );
      
      return agendamentosFiltrados || [];
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

      // Verificar conflito de horário com outros agendamentos
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

      // Verificar conflito com bloqueios de agenda
      const { data: bloqueios, error: bloqueioError } = await supabase
        .from('bloqueios_agenda')
        .select('id, titulo')
        .eq('profissional_id', agendamento.profissional_id)
        .or(`and(data_inicio.lte.${agendamento.data_inicio},data_fim.gt.${agendamento.data_inicio}),and(data_inicio.lt.${agendamento.data_fim},data_fim.gte.${agendamento.data_fim}),and(data_inicio.gte.${agendamento.data_inicio},data_fim.lte.${agendamento.data_fim})`);

      if (bloqueioError) throw bloqueioError;
      
      if (bloqueios && bloqueios.length > 0) {
        throw new Error('Este horário está bloqueado na agenda do profissional');
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

      // Criar evento no Google Calendar apenas se o profissional tiver a integração configurada
      try {
        const { data: profissional } = await supabase
          .from('profissionais')
          .select('google_refresh_token')
          .eq('id', agendamento.profissional_id)
          .single();
        
        if (profissional?.google_refresh_token) {
          await supabase.functions.invoke('google-calendar', {
            body: {
              action: 'create',
              agendamentoId: data.id,
            },
          });
        }
      } catch (calendarError) {
        console.warn('Erro ao criar evento no Google Calendar:', calendarError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-hoje'] });
      queryClient.invalidateQueries({ queryKey: ['proximos-agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-stats'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-recentes'] });
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

      // Atualizar evento no Google Calendar apenas se o profissional tiver a integração configurada
      try {
        const { data: profissional } = await supabase
          .from('profissionais')
          .select('google_refresh_token')
          .eq('id', updated.profissional_id)
          .single();
        
        if (profissional?.google_refresh_token) {
          await supabase.functions.invoke('google-calendar', {
            body: {
              action: 'update',
              agendamentoId: id,
            },
          });
        }
      } catch (calendarError) {
        console.warn('Erro ao atualizar evento no Google Calendar:', calendarError);
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-hoje'] });
      queryClient.invalidateQueries({ queryKey: ['proximos-agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos-stats'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-recentes'] });
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
      queryClient.invalidateQueries({ queryKey: ['agendamentos-stats'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-recentes'] });
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
      // Marcar consulta como desmarcada
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-recentes'] });
      toast.success('Consulta desmarcada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao desmarcar consulta: ' + error.message);
    },
  });
}


export function useMarcarRealizado() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('agendamentos')
        .update({ status: 'realizado' })
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
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] });
      toast.success('Consulta marcada como realizada! Pagamento pendente criado automaticamente.');
    },
    onError: (error: any) => {
      toast.error('Erro ao marcar como realizada: ' + error.message);
    },
  });
}

export function useMarcarFalta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('agendamentos')
        .update({ status: 'falta' })
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
      queryClient.invalidateQueries({ queryKey: ['agendamentos-stats'] });
      queryClient.invalidateQueries({ queryKey: ['atividades-recentes'] });
      toast.success('Paciente marcado como falta.');
    },
    onError: (error: any) => {
      toast.error('Erro ao marcar falta: ' + error.message);
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
      const hoje = new Date();
      const inicioHoje = getStartOfDayLocal(hoje).toISOString();
      const fimHoje = getEndOfDayLocal(hoje).toISOString();
      
      // Consultas hoje
      const { data: consultasHoje, error: hojeError } = await supabase
        .from('agendamentos')
        .select(`
          status, 
          confirmado_pelo_paciente,
          profissionais!inner(clinica_id)
        `)
        .in('profissionais.clinica_id', clinicaIds)
        .eq('desmarcada', false)
        .gte('data_inicio', inicioHoje)
        .lt('data_inicio', fimHoje);
      
      if (hojeError) throw hojeError;

      // Consultas pendentes (geral)
      const { count: pendentes, error: pendentesError } = await supabase
        .from('agendamentos')
        .select(`
          *,
          profissionais!inner(clinica_id)
        `, { count: 'exact', head: true })
        .in('profissionais.clinica_id', clinicaIds)
        .eq('desmarcada', false)
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
