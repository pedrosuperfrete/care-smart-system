import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type UsuarioClinica = Tables<'usuarios_clinicas'>;
type UsuarioClinicaInsert = TablesInsert<'usuarios_clinicas'>;
type UsuarioClinicaUpdate = TablesUpdate<'usuarios_clinicas'>;

export function useUsuariosClinicas(clinicaId?: string) {
  return useQuery({
    queryKey: ['usuarios_clinicas', clinicaId],
    queryFn: async (): Promise<UsuarioClinica[]> => {
      let query = supabase
        .from('usuarios_clinicas')
        .select(`
          *,
          clinicas(id, nome),
          users(id, email)
        `);

      if (clinicaId) {
        query = query.eq('clinica_id', clinicaId);
      }

      const { data, error } = await query.eq('ativo', true);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useUserClinicas() {
  return useQuery({
    queryKey: ['user_clinicas'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_clinicas');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateUsuarioClinica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (usuarioClinica: UsuarioClinicaInsert): Promise<UsuarioClinica> => {
      const { data, error } = await supabase
        .from('usuarios_clinicas')
        .insert(usuarioClinica)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios_clinicas'] });
      toast.success('Usuário associado à clínica com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao associar usuário: ' + error.message);
    },
  });
}

export function useUpdateUsuarioClinica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UsuarioClinicaUpdate & { id: string }): Promise<UsuarioClinica> => {
      const { data, error } = await supabase
        .from('usuarios_clinicas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios_clinicas'] });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar usuário: ' + error.message);
    },
  });
}

export function useRemoveUsuarioClinica() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('usuarios_clinicas')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios_clinicas'] });
      toast.success('Usuário removido da clínica!');
    },
    onError: (error) => {
      toast.error('Erro ao remover usuário: ' + error.message);
    },
  });
}