import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { profissional } = useAuth();

  return useMutation({
    mutationFn: async (data: { nome: string; conteudo: string; especialidade?: string }) => {
      if (!profissional?.clinica_id) {
        throw new Error('Profissional ou clínica não encontrada');
      }

      const { data: result, error } = await supabase
        .from('modelos_prontuarios')
        .insert({
          nome: data.nome,
          conteudo: data.conteudo,
          especialidade: data.especialidade,
          clinica_id: profissional.clinica_id
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelos-prontuarios'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar template:', error);
      toast.error('Erro ao criar template: ' + error.message);
    },
  });
}