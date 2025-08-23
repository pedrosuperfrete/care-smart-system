import { supabase } from '@/integrations/supabase/client';

// Configurar captura global de erros JavaScript
export function setupGlobalErrorHandling() {
  // Capturar erros JavaScript não tratados
  window.addEventListener('error', async (event) => {
    await logGlobalError('UNHANDLED_JAVASCRIPT_ERROR', {
      message: event.error?.message || event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  });

  // Capturar promises rejeitadas não tratadas
  window.addEventListener('unhandledrejection', async (event) => {
    await logGlobalError('UNHANDLED_PROMISE_REJECTION', {
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  });

  console.log('✅ Sistema de logging de erros inicializado');
}

async function logGlobalError(tipo: string, errorData: any) {
  try {
    // Buscar usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    let profissionalId = null;
    if (user) {
      const { data: profissional } = await supabase
        .from('profissionais')
        .select('id')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .single();
      
      profissionalId = profissional?.id;
    }

    // Inserir erro no banco
    await supabase
      .from('erros_sistema')
      .insert({
        user_id: user?.id,
        profissional_id: profissionalId,
        tipo,
        mensagem_erro: `${errorData.message}\n\nDetalhes: ${JSON.stringify(errorData, null, 2)}`,
        data_ocorrencia: new Date().toISOString(),
        resolvido: false,
        tentativas_retry: 0
      });

    console.error(`🔥 ${tipo} capturado:`, errorData);

  } catch (logError) {
    console.error('Erro ao processar log global:', logError);
  }
}

// Wrapper para funções que podem gerar erro
export function withErrorLogging<T extends (...args: any[]) => any>(
  fn: T,
  context: string
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Se é uma Promise, capturar erros assíncronos
      if (result && typeof result.then === 'function') {
        return result.catch((error: Error) => {
          logGlobalError('ASYNC_FUNCTION_ERROR', {
            context,
            message: error.message,
            stack: error.stack,
            args: JSON.stringify(args),
            url: window.location.href
          });
          throw error;
        });
      }
      
      return result;
    } catch (error: any) {
      logGlobalError('SYNC_FUNCTION_ERROR', {
        context,
        message: error.message,
        stack: error.stack,
        args: JSON.stringify(args),
        url: window.location.href
      });
      throw error;
    }
  }) as T;
}

// Wrapper para operações do Supabase
export async function withSupabaseErrorLogging<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: any
): Promise<T> {
  try {
    const result = await operation();
    return result;
  } catch (error: any) {
    await logGlobalError('SUPABASE_OPERATION_ERROR', {
      operation: operationName,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      context: JSON.stringify(context),
      url: window.location.href
    });
    throw error;
  }
}