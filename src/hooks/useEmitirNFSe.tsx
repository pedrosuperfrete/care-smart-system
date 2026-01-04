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

interface StatusNFSeResponse {
  success: boolean;
  status: 'emitida' | 'pendente' | 'erro';
  updated?: boolean;
  nota_fiscal?: any;
  message?: string;
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
      const notaFiscalId = (data as any)?.nota_fiscal?.id as string | undefined;

      if (link && notaFiscalId) {
        toast.success(data.message || 'Nota fiscal pronta!', {
          action: {
            label: 'Baixar NF',
            onClick: async () => {
              const { data: blob, error } = await supabase.functions.invoke('nfse-download', {
                body: { nota_fiscal_id: notaFiscalId },
              });

              if (error) {
                toast.error((error as any)?.message || 'Não foi possível baixar a nota fiscal');
                return;
              }

              const url = URL.createObjectURL(blob as Blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `nfse-${String((data as any)?.nota_fiscal?.numero_nf || notaFiscalId)}.pdf`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
            },
          },
        });
      } else {
        toast.success(data.message || 'Nota fiscal enviada para processamento!', {
          description: 'A prefeitura está processando. Atualizaremos o status automaticamente.',
          duration: 5000,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] });
      queryClient.invalidateQueries({ queryKey: ['pagamentos'] });
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal'] });
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal-agendamento'] });
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal-agendamentos'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao emitir nota fiscal');
    },
  });
}

// Hook para verificar status da NF no PlugNotas
export function useVerificarStatusNFSe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { nota_fiscal_id?: string; pagamento_id?: string }): Promise<StatusNFSeResponse> => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('nfse-status', {
        body: params,
      });

      if (error) {
        throw new Error(error.message || 'Erro ao verificar status da NF');
      }

      return data as StatusNFSeResponse;
    },
    onSuccess: (data) => {
      if (data.updated && data.status === 'emitida') {
        toast.success('Nota Fiscal emitida com sucesso!', {
          description: 'A NF foi processada pela prefeitura e está disponível para download.',
          action: {
            label: 'Ver NF',
            onClick: () => {
              // Invalidar queries para atualizar a UI
              queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] });
              queryClient.invalidateQueries({ queryKey: ['nota-fiscal'] });
              queryClient.invalidateQueries({ queryKey: ['nota-fiscal-agendamento'] });
              queryClient.invalidateQueries({ queryKey: ['nota-fiscal-agendamentos'] });
            },
          },
        });
      }
      queryClient.invalidateQueries({ queryKey: ['notas-fiscais'] });
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal'] });
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal-agendamento'] });
      queryClient.invalidateQueries({ queryKey: ['nota-fiscal-agendamentos'] });
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
