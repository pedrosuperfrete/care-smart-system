
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function usePlanos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: planoInfo } = useQuery({
    queryKey: ['plano-info', user?.id],
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

  const { data: paymentHistory } = useQuery({
    queryKey: ['payment-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createCheckoutSession = useMutation({
    mutationFn: async (priceId: string) => {
      console.log('Creating checkout session for price:', priceId);
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        throw error;
      }
      
      console.log('Checkout session created:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Redirecting to:', data.url);
      // Abrir em nova aba
      window.open(data.url, '_blank');
      
      // Invalidar queries para forçar atualização
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['plano-info'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
        queryClient.invalidateQueries({ queryKey: ['contador-pacientes'] });
      }, 2000);
    },
    onError: (error: any) => {
      console.error('Checkout error:', error);
      toast.error('Erro ao criar sessão de pagamento: ' + error.message);
    },
  });

  const createCustomerPortal = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-customer-portal');

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    },
    onError: (error: any) => {
      toast.error('Erro ao acessar portal: ' + error.message);
    },
  });

  const refreshPlanStatus = () => {
    queryClient.invalidateQueries({ queryKey: ['plano-info'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
    queryClient.invalidateQueries({ queryKey: ['contador-pacientes'] });
    queryClient.invalidateQueries({ queryKey: ['plano-atual'] });
  };

  return {
    planoInfo,
    paymentHistory,
    createCheckoutSession,
    createCustomerPortal,
    refreshPlanStatus,
    isLoading: !planoInfo,
  };
}

export function useLimitePacientes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: contadorPacientes, refetch: refetchContador } = useQuery({
    queryKey: ['contador-pacientes'],
    queryFn: async () => {
      if (!user) return 0;

      const { data: clinica } = await supabase
        .from('profissionais')
        .select('clinica_id')
        .eq('user_id', user.id)
        .single();

      if (!clinica?.clinica_id) return 0;

      const { count, error } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .eq('clinica_id', clinica.clinica_id)
        .eq('ativo', true);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: planoAtual, refetch: refetchPlano } = useQuery({
    queryKey: ['plano-atual', user?.id],
    queryFn: async () => {
      if (!user) return 'free';

      const { data, error } = await supabase
        .from('users')
        .select('plano, subscription_status')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      // Se o plano for 'pro', considerar sempre como ativo
      // Independente do subscription_status
      return data?.plano === 'pro' ? 'pro' : 'free';
    },
    enabled: !!user,
    refetchInterval: 5000, // Refetch a cada 5 segundos
  });

  const refreshPlanStatus = () => {
    refetchPlano();
    refetchContador();
    queryClient.invalidateQueries({ queryKey: ['plano-info'] });
    queryClient.invalidateQueries({ queryKey: ['plano-atual'] });
    queryClient.invalidateQueries({ queryKey: ['contador-pacientes'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
  };

  const limitePacientes = planoAtual === 'free' ? 2 : Infinity;
  const atingiuLimite = planoAtual === 'free' && (contadorPacientes || 0) >= 2;
  const podeAdicionarPaciente = !atingiuLimite;

  return {
    contadorPacientes: contadorPacientes || 0,
    limitePacientes,
    atingiuLimite,
    podeAdicionarPaciente,
    planoAtual: planoAtual || 'free',
    refreshPlanStatus,
  };
}
