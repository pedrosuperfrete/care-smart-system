
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function usePlanos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['planos', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('plano, subscription_status, subscription_end_date')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateCheckoutSession() {
  return async () => {
    const { data, error } = await supabase.functions.invoke('create-checkout-session');
    
    if (error) throw error;
    
    if (data?.url) {
      window.open(data.url, '_blank');
    }
    
    return data;
  };
}

export function usePacientesLimit() {
  const { user } = useAuth();
  const { data: planData } = usePlanos();

  return useQuery({
    queryKey: ['pacientes-limit', user?.id],
    queryFn: async () => {
      if (!user) return { count: 0, limit: 0, isAtLimit: false };

      try {
        const { count, error } = await supabase
          .from('pacientes')
          .select('*', { count: 'exact', head: true })
          .eq('ativo', true);

        if (error) {
          console.error('Erro ao contar pacientes:', error);
          // Em caso de erro de RLS, assumir 0 pacientes
          return { count: 0, limit: 2, isAtLimit: false, isPro: false };
        }

        const isPro = planData?.plano === 'pro';
        const limit = isPro ? Infinity : 2;
        const pacientesCount = count || 0;
        const isAtLimit = !isPro && pacientesCount >= limit;

        return {
          count: pacientesCount,
          limit: isPro ? 'Ilimitado' : limit,
          isAtLimit,
          isPro
        };
      } catch (error) {
        console.error('Erro geral ao verificar limite de pacientes:', error);
        return { count: 0, limit: 2, isAtLimit: false, isPro: false };
      }
    },
    enabled: !!user && !!planData,
  });
}
