import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface TipoServico {
  id: string;
  nome: string;
  preco?: number;
  ativo: boolean;
  clinica_id?: string;
  profissional_id?: string;
  percentual_cobranca_falta?: number;
  percentual_cobranca_agendamento?: number;
  criado_em: string;
  atualizado_em: string;
}

export interface CreateTipoServicoData {
  nome: string;
  preco?: number;
  clinica_id?: string;
  profissional_id?: string;
  percentual_cobranca_falta?: number;
  percentual_cobranca_agendamento?: number;
}

export interface UpdateTipoServicoData {
  nome?: string;
  preco?: number;
  ativo?: boolean;
  percentual_cobranca_falta?: number | null;
  percentual_cobranca_agendamento?: number | null;
}

export function useTiposServicos() {
  const { profissional } = useAuth();
  
  return useQuery({
    queryKey: ['tipos-servicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_servicos')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data as TipoServico[];
    },
    enabled: !!profissional
  });
}

export function useCreateTipoServico() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateTipoServicoData) => {
      const { data: result, error } = await supabase
        .from('tipos_servicos')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-servicos'] });
      toast.success('Tipo de serviço criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar tipo de serviço:', error);
      toast.error('Erro ao criar tipo de serviço');
    }
  });
}

export function useUpdateTipoServico() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTipoServicoData }) => {
      const { data: result, error } = await supabase
        .from('tipos_servicos')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-servicos'] });
      toast.success('Tipo de serviço atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar tipo de serviço:', error);
      toast.error('Erro ao atualizar tipo de serviço');
    }
  });
}

export function useDeleteTipoServico() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete - marcar como inativo
      const { error } = await supabase
        .from('tipos_servicos')
        .update({ ativo: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-servicos'] });
      toast.success('Tipo de serviço removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover tipo de serviço:', error);
      toast.error('Erro ao remover tipo de serviço');
    }
  });
}