import React, { Component, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log do erro no Supabase
    this.logErrorToSupabase(error, errorInfo);
  }

  private async logErrorToSupabase(error: Error, errorInfo: React.ErrorInfo) {
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
          tipo: 'REACT_ERROR_BOUNDARY',
          mensagem_erro: `${error.message}\n\nStack: ${error.stack}\n\nComponent Stack: ${errorInfo.componentStack}`,
          data_ocorrencia: new Date().toISOString(),
          resolvido: false,
          tentativas_retry: 0
        });

      console.error('🔥 Erro React capturado pelo ErrorBoundary:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });

    } catch (logError) {
      console.error('Erro ao salvar log no ErrorBoundary:', logError);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
          <Card className="max-w-md w-full p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Ops! Algo deu errado</h2>
              <p className="text-muted-foreground">
                Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente e está trabalhando para resolver o problema.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="text-left bg-muted p-3 rounded text-sm">
                <p className="font-medium text-destructive mb-1">Detalhes do erro (desenvolvimento):</p>
                <p className="break-all">{this.state.error?.message}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button 
                onClick={this.handleReload}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
              
              <Button 
                onClick={this.handleGoHome}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Ir ao Início
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}