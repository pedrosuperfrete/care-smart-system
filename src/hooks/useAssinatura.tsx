import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
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

export function useVerificarLimitePacientes() {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['limite-pacientes'],
    queryFn: async () => {
      // Buscar dados do profissional
      const { data: profissional, error: profError } = await supabase
        .from('profissionais')
        .select('assinatura_ativa')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profError) throw profError;

      // Contar pacientes do profissional
      const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
      
      if (!clinicasUsuario || clinicasUsuario.length === 0) {
        return { podeAdicionarPaciente: false, totalPacientes: 0, assinaturaAtiva: false };
      }

      const clinicaIds = clinicasUsuario.map(c => c.clinica_id);
      
      const { count: totalPacientes, error } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .in('clinica_id', clinicaIds)
        .eq('ativo', true);

      if (error) throw error;

      const assinaturaAtiva = profissional?.assinatura_ativa || false;
      const podeAdicionarPaciente = assinaturaAtiva || (totalPacientes || 0) < 2;

      return {
        podeAdicionarPaciente,
        totalPacientes: totalPacientes || 0,
        assinaturaAtiva,
      };
    },
  });
}