
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Clinica = Tables<'clinicas'>;

export function useClinica() {
  return useQuery({
    queryKey: ['clinica'],
    queryFn: async (): Promise<Clinica | null> => {
      // Buscar clínicas do usuário
      const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
      
      if (!clinicasUsuario || clinicasUsuario.length === 0) {
        return null;
      }

      // Pegar dados da primeira clínica do usuário
      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .eq('id', clinicasUsuario[0].clinica_id)
        .single();

      if (error) throw error;
      return data;
    },
  });
}
