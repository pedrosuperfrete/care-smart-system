
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Profissional = Tables<'profissionais'>;
type ProfissionalInsert = TablesInsert<'profissionais'>;
type ProfissionalUpdate = TablesUpdate<'profissionais'>;

export function useProfissionais() {
  return useQuery({
    queryKey: ['profissionais'],
    queryFn: async (): Promise<Profissional[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      // Buscar informações do usuário para determinar o tipo
      const { data: userData } = await supabase
        .from('users')
        .select('tipo_usuario')
        .eq('id', user.id)
        .single();

      // Se for admin, buscar todos os profissionais
      if (userData?.tipo_usuario === 'admin') {
        const { data, error } = await supabase
          .from('profissionais')
          .select('*')
          .eq('ativo', true)
          .order('nome');

        if (error) throw error;
        return data || [];
      }

      // Para outros tipos de usuário, buscar profissionais das clínicas associadas
      const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
      
      if (!clinicasUsuario || clinicasUsuario.length === 0) {
        return [];
      }

      // Filtrar profissionais pelas clínicas do usuário
      const clinicaIds = clinicasUsuario.map(c => c.clinica_id);

      const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .in('clinica_id', clinicaIds)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useProfissional(id: string) {
  return useQuery({
    queryKey: ['profissional', id],
    queryFn: async (): Promise<Profissional | null> => {
      const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProfissional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profissional: ProfissionalInsert): Promise<Profissional> => {
      const { data, error } = await supabase
        .from('profissionais')
        .insert(profissional)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      toast.success('Profissional criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar profissional: ' + error.message);
    },
  });
}

export function useUpdateProfissional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ProfissionalUpdate & { id: string }): Promise<Profissional> => {
      const { data, error } = await supabase
        .from('profissionais')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profissionais'] });
      queryClient.invalidateQueries({ queryKey: ['profissional', data.id] });
      toast.success('Profissional atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar profissional: ' + error.message);
    },
  });
}
