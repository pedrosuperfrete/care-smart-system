
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Clinica = Tables<'clinicas'>;

export function useClinica() {
  return useQuery({
    queryKey: ['clinica'],
    queryFn: async (): Promise<Clinica | null> => {
      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}
