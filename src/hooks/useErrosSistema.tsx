import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type ErroSistema = Tables<'erros_sistema'>;

export function useErrosSistema() {
  return useQuery({
    queryKey: ['erros-sistema'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erros_sistema')
        .select('*')
        .eq('resolvido', false)
        .order('data_ocorrencia', { ascending: false });

      if (error) throw error;
      return data as ErroSistema[];
    },
  });
}

export function useErrosSistemaPorEntidade(entidadeId: string) {
  return useQuery({
    queryKey: ['erros-sistema', entidadeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erros_sistema')
        .select('*')
        .eq('entidade_id', entidadeId)
        .eq('resolvido', false)
        .order('data_ocorrencia', { ascending: false });

      if (error) throw error;
      return data as ErroSistema[];
    },
  });
}

export function useMarcarErroResolvido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (erroId: string) => {
      const { error } = await supabase
        .from('erros_sistema')
        .update({ 
          resolvido: true,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', erroId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erros-sistema'] });
      toast({
        title: "Erro marcado como resolvido",
        description: "O erro foi marcado como resolvido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao marcar como resolvido",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useTentarNovamenteSincronizacao() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ erroId, agendamentoId }: { erroId: string; agendamentoId: string }) => {
      // Primeiro buscar o erro atual para incrementar tentativas
      const { data: erroAtual } = await supabase
        .from('erros_sistema')
        .select('tentativas_retry')
        .eq('id', erroId)
        .single();

      const novasTentativas = (erroAtual?.tentativas_retry || 0) + 1;

      // Incrementar tentativas de retry
      const { error: updateError } = await supabase
        .from('erros_sistema')
        .update({ 
          tentativas_retry: novasTentativas,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', erroId);

      if (updateError) throw updateError;

      // Tentar sincronizar novamente
      const { error } = await supabase.functions.invoke('google-calendar', {
        body: {
          action: 'create',
          agendamentoId: agendamentoId,
        },
      });

      if (error) throw error;

      // Se chegou até aqui, marcar como resolvido
      const { error: resolveError } = await supabase
        .from('erros_sistema')
        .update({ 
          resolvido: true,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', erroId);

      if (resolveError) throw resolveError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erros-sistema'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      toast({
        title: "Sincronização realizada",
        description: "O agendamento foi sincronizado com sucesso no Google Calendar.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na sincronização",
        description: `Falha ao sincronizar: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}