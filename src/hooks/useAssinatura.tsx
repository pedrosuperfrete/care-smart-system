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
      try {
        // Usar a função can_create_patient que já considera profissionais e recepcionistas
        const { data: podeCrear, error: canCreateError } = await supabase.rpc('can_create_patient');
        
        if (canCreateError) throw canCreateError;

        // Buscar dados do usuário atual
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error("Usuário não autenticado");

        const { data: userProfile } = await supabase
          .from('users')
          .select('tipo_usuario')
          .eq('id', user.user.id)
          .single();

        // Para profissionais, buscar dados diretos
        // Para recepcionistas, buscar o profissional da clínica
        let assinaturaAtiva = false;
        
        if (userProfile?.tipo_usuario === 'profissional') {
          const { data: profissional } = await supabase
            .from('profissionais')
            .select('assinatura_ativa')
            .eq('user_id', user.user.id)
            .single();
          assinaturaAtiva = profissional?.assinatura_ativa || false;
        } else if (userProfile?.tipo_usuario === 'recepcionista') {
          const { data: clinicasUsuario } = await supabase.rpc('get_user_clinicas');
          if (clinicasUsuario && clinicasUsuario.length > 0) {
            const { data: profissionalClinica } = await supabase
              .from('profissionais')
              .select('assinatura_ativa')
              .eq('clinica_id', clinicasUsuario[0].clinica_id)
              .eq('ativo', true)
              .maybeSingle();
            assinaturaAtiva = profissionalClinica?.assinatura_ativa || false;
          }
        }

        // Contar pacientes do usuário (considerando suas clínicas)
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

        return {
          podeAdicionarPaciente: podeCrear,
          totalPacientes: totalPacientes || 0,
          assinaturaAtiva,
        };
      } catch (error) {
        console.error('Erro ao verificar limite de pacientes:', error);
        return { podeAdicionarPaciente: false, totalPacientes: 0, assinaturaAtiva: false };
      }
    },
  });
}