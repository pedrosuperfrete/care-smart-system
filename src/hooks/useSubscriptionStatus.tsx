
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useSubscriptionStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('plano, subscription_status, subscription_end_date, stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 5000, // Refetch a cada 5 segundos para capturar mudanças
  });
}
