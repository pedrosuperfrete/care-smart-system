import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface LimitePlano {
  assinatura_ativa: boolean;
  tipo_plano: string | null;
  total_profissionais: number;
  total_secretarias: number;
  max_profissionais: number;
  max_secretarias: number;
  pode_adicionar_profissional: boolean;
  pode_adicionar_secretaria: boolean;
  profissionais_adicionais_permitidos: number;
}

export function useLimitePlano() {
  const { clinicaAtual } = useAuth();

  return useQuery({
    queryKey: ['limite-plano', clinicaAtual],
    queryFn: async (): Promise<LimitePlano | null> => {
      if (!clinicaAtual) return null;

      const { data, error } = await supabase.rpc('verificar_limite_plano', {
        p_clinica_id: clinicaAtual,
      });

      if (error) {
        console.error('Erro ao verificar limite do plano:', error);
        throw error;
      }

      return data as unknown as LimitePlano;
    },
    enabled: !!clinicaAtual,
  });
}

export function usePodeAdicionarMembro(tipoPapel: 'profissional' | 'recepcionista') {
  const { data: limites, isLoading } = useLimitePlano();

  if (isLoading || !limites) {
    return { podeAdicionar: false, isLoading: true, limites: null };
  }

  const podeAdicionar = tipoPapel === 'profissional' 
    ? limites.pode_adicionar_profissional 
    : limites.pode_adicionar_secretaria;

  return { podeAdicionar, isLoading: false, limites };
}
