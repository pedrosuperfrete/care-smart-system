
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Clinica = Tables<'clinicas'>;

export function useClinica() {
  return useQuery({
    queryKey: ['clinica'],
    queryFn: async (): Promise<Clinica | null> => {
      console.log('useClinica - Iniciando busca por clínicas do usuário');
      
      try {
        // Buscar clínicas do usuário
        const { data: clinicasUsuario, error: rpcError } = await supabase.rpc('get_user_clinicas');
        console.log('useClinica - Clínicas do usuário:', clinicasUsuario);
        console.log('useClinica - Erro RPC (se houver):', rpcError);
        
        if (rpcError) {
          console.error('Erro na função RPC:', rpcError);
          throw rpcError;
        }
        
        if (!clinicasUsuario || clinicasUsuario.length === 0) {
          console.log('useClinica - Nenhuma clínica encontrada para o usuário');
          return null;
        }

        console.log('useClinica - Buscando dados da clínica com ID:', clinicasUsuario[0].clinica_id);

        // Pegar dados da primeira clínica do usuário
        const { data, error } = await supabase
          .from('clinicas')
          .select('*')
          .eq('id', clinicasUsuario[0].clinica_id)
          .single();

        console.log('useClinica - Dados da clínica retornados:', data);
        console.log('useClinica - Erro na busca da clínica (se houver):', error);

        if (error) {
          console.error('Erro ao buscar dados da clínica:', error);
          throw error;
        }
        
        return data;
      } catch (error) {
        console.error('Erro geral no useClinica:', error);
        throw error;
      }
    },
  });
}
