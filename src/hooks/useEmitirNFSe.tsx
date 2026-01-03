import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmitirNFSeResponse {
  success: boolean;
  message: string;
  nfse_id?: string;
  nota_fiscal?: any;
  error?: string;
}

export function useEmitirNFSe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pagamentoId: string): Promise<EmitirNFSeResponse> => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('emitir-nfse', {
        body: { pagamento_id: pagamentoId },
      });

      if (error) {
        // Supabase retorna FunctionsHttpError com o body da resposta em error.context.body
        let message = error.message || 'Erro ao emitir nota fiscal';
        const ctxBody = (error as any)?.context?.body;
        try {
          const parsed = typeof ctxBody === 'string' ? JSON.parse(ctxBody) : ctxBody;
          const errObj = parsed?.error;
          if (typeof errObj === 'string') message = errObj;
          else if (errObj?.message) {
            message = errObj.message;
            const fields = errObj?.data?.fields;
            if (fields && typeof fields === 'object') {
              const first = Object.entries(fields)[0];
              if (first) message = `${message}: ${String(first[1])}`;
            }
          }
        } catch {
          // noop
        }
        throw new Error(message);
      }

      if ((data as any)?.error) {
        const errObj = (data as any).error;
        let message = 'Erro ao emitir nota fiscal';
        if (typeof errObj === 'string') message = errObj;
        else if (errObj?.message) {
          message = errObj.message;
          const fields = errObj?.data?.fields;
          if (fields && typeof fields === 'object') {
            const first = Object.entries(fields)[0];
            if (first) message = `${message}: ${String(first[1])}`;
          }
        }
        throw new Error(message);
      }

      return data as EmitirNFSeResponse;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Nota fiscal enviada para processamento!');
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] });
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao emitir nota fiscal');
    },
  });
}

export function useNotaFiscalByPagamento(pagamentoId: string | undefined) {
  return useQuery({
    queryKey: ['nota-fiscal', pagamentoId],
    queryFn: async () => {
      if (!pagamentoId) return null;

      const { data, error } = await supabase
        .from('notas_fiscais')
        .select('*')
        .eq('pagamento_id', pagamentoId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar nota fiscal:', error);
        return null;
      }

      return data;
    },
    enabled: !!pagamentoId,
  });
}
