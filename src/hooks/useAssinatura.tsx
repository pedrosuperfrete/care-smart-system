import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAssinatura() {
  return useQuery({
    queryKey: ['assinatura'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: async (planType?: string) => {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao criar checkout: ' + error.message);
    },
  });
}

export function useCustomerPortal() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao abrir portal: ' + error.message);
    },
  });
}
