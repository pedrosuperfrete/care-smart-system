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
      const link = (data as any)?.nota_fiscal?.link_nf as string | undefined;
      if (link) {
        toast.success(data.message || 'Nota fiscal pronta!', {
          action: {
            label: 'Baixar NF',
            onClick: () => window.open(link, '_blank', 'noopener,noreferrer'),
          },
        });
      } else {
        toast.success(data.message || 'Nota fiscal enviada para processamento!');
      }
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] });
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal'] });
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal-agendamento'] });
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

// Fallback: se o pagamento atual foi recriado/alterado, buscamos NF por agendamento
// (qualquer NF emitida para qualquer pagamento do mesmo agendamento)
export function useNotaFiscalByAgendamento(agendamentoId: string | undefined) {
  return useQuery({
    queryKey: ['nota-fiscal-agendamento', agendamentoId],
    queryFn: async () => {
      if (!agendamentoId) return null;

      const { data: pagamentos, error: pagamentosError } = await supabase
        .from('pagamentos')
        .select('id')
        .eq('agendamento_id', agendamentoId);

      if (pagamentosError) {
        console.error('Erro ao buscar pagamentos do agendamento:', pagamentosError);
        return null;
      }

      const ids = (pagamentos || []).map((p: any) => p.id).filter(Boolean);
      if (!ids.length) return null;

      const { data: nf, error: nfError } = await supabase
        .from('notas_fiscais')
        .select('*')
        .in('pagamento_id', ids)
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (nfError) {
        console.error('Erro ao buscar nota fiscal por agendamento:', nfError);
        return null;
      }

      return nf;
    },
    enabled: !!agendamentoId,
  });
}

// Para a lista do Financeiro: buscar NFs em lote por agendamentos
export function useNotasFiscaisByAgendamentos(agendamentoIds: string[]) {
  return useQuery({
    queryKey: ['nota-fiscal-agendamentos', agendamentoIds],
    queryFn: async () => {
      if (!agendamentoIds?.length) return {} as Record<string, any>;

      const { data, error } = await supabase
        .from('notas_fiscais')
        .select('*, pagamentos!inner(agendamento_id)')
        .in('pagamentos.agendamento_id', agendamentoIds)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar notas fiscais por agendamentos:', error);
        return {} as Record<string, any>;
      }

      const map: Record<string, any> = {};
      for (const nf of data || []) {
        const agId = (nf as any)?.pagamentos?.agendamento_id;
        if (agId && !map[agId]) {
          map[agId] = nf;
        }
      }

      return map;
    },
    enabled: Array.isArray(agendamentoIds) && agendamentoIds.length > 0,
  });
}
