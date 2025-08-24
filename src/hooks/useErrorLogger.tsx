import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ErrorLogData {
  tipo: string;
  mensagem_erro: string;
  entidade_id?: string;
  stack_trace?: string;
  url?: string;
  user_agent?: string;
  dados_contexto?: any;
}

export function useErrorLogger() {
  const { user } = useAuth();

  const logError = useCallback(async (errorData: ErrorLogData) => {
    try {
      // Buscar profissional_id apenas se o usuário for profissional
      let profissionalId = null;
      if (user) {
        // Primeiro buscar o tipo de usuário
        const { data: userProfile } = await supabase
          .from('users')
          .select('tipo_usuario')
          .eq('id', user.id)
          .single();
        
        // Só buscar profissional se for do tipo 'profissional'
        if (userProfile?.tipo_usuario === 'profissional') {
          const { data: profissional } = await supabase
            .from('profissionais')
            .select('id')
            .eq('user_id', user.id)
            .eq('ativo', true)
            .maybeSingle(); // Usar maybeSingle para não dar erro se não encontrar
          
          profissionalId = profissional?.id;
        }
      }

      // Inserir log de erro no banco
      const { error } = await supabase
        .from('erros_sistema')
        .insert({
          user_id: user?.id,
          profissional_id: profissionalId,
          entidade_id: errorData.entidade_id,
          tipo: errorData.tipo,
          mensagem_erro: errorData.mensagem_erro,
          data_ocorrencia: new Date().toISOString(),
          resolvido: false,
          tentativas_retry: 0
        });

      if (error) {
        console.error('Erro ao salvar log de erro:', error);
      }

      // Log no console para desenvolvimento
      console.error('🔥 Erro capturado:', {
        ...errorData,
        user_id: user?.id,
        timestamp: new Date().toISOString()
      });

    } catch (logError) {
      console.error('Erro ao processar log de erro:', logError);
    }
  }, [user]);

  // Função para capturar erros JavaScript automaticamente
  const logJavaScriptError = useCallback((error: Error, errorInfo?: any) => {
    logError({
      tipo: 'JAVASCRIPT_ERROR',
      mensagem_erro: error.message,
      stack_trace: error.stack,
      url: window.location.href,
      user_agent: navigator.userAgent,
      dados_contexto: errorInfo
    });
  }, [logError]);

  // Função para erros de API/Supabase
  const logSupabaseError = useCallback((operation: string, error: any, context?: any) => {
    logError({
      tipo: 'SUPABASE_ERROR',
      mensagem_erro: `${operation}: ${error.message || JSON.stringify(error)}`,
      url: window.location.href,
      dados_contexto: {
        operation,
        error_code: error.code,
        error_details: error.details,
        context
      }
    });
  }, [logError]);

  // Função para erros de validação
  const logValidationError = useCallback((field: string, value: any, rule: string) => {
    logError({
      tipo: 'VALIDATION_ERROR',
      mensagem_erro: `Erro de validação no campo '${field}': ${rule}`,
      url: window.location.href,
      dados_contexto: {
        field,
        value: typeof value === 'object' ? JSON.stringify(value) : value,
        rule
      }
    });
  }, [logError]);

  // Função para erros de navegação/roteamento
  const logNavigationError = useCallback((route: string, error: string) => {
    logError({
      tipo: 'NAVIGATION_ERROR',
      mensagem_erro: `Erro de navegação para '${route}': ${error}`,
      url: window.location.href
    });
  }, [logError]);

  // Função para erros personalizados
  const logCustomError = useCallback((tipo: string, mensagem: string, context?: any) => {
    logError({
      tipo: tipo.toUpperCase(),
      mensagem_erro: mensagem,
      url: window.location.href,
      dados_contexto: context
    });
  }, [logError]);

  return {
    logError,
    logJavaScriptError,
    logSupabaseError,
    logValidationError,
    logNavigationError,
    logCustomError
  };
}