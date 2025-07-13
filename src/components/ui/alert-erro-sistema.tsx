import { AlertTriangle, RefreshCw, CheckCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";
import { useTentarNovamenteSincronizacao, useMarcarErroResolvido } from "@/hooks/useErrosSistema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type ErroSistema = Tables<'erros_sistema'>;

interface AlertErroSistemaProps {
  erro: ErroSistema;
  variant?: "inline" | "card";
  showActions?: boolean;
}

export function AlertErroSistema({ 
  erro, 
  variant = "card", 
  showActions = true 
}: AlertErroSistemaProps) {
  const tentarNovamente = useTentarNovamenteSincronizacao();
  const marcarResolvido = useMarcarErroResolvido();

  const handleTentarNovamente = () => {
    if (erro.entidade_id) {
      tentarNovamente.mutate({
        erroId: erro.id,
        agendamentoId: erro.entidade_id
      });
    }
  };

  const handleMarcarResolvido = () => {
    marcarResolvido.mutate(erro.id);
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'calendar_sync':
        return 'Sincronização Google Calendar';
      case 'pagamento':
        return 'Pagamento';
      case 'sistema':
        return 'Sistema';
      default:
        return tipo;
    }
  };

  const getVariantBadge = (tipo: string) => {
    switch (tipo) {
      case 'calendar_sync':
        return 'secondary';
      case 'pagamento':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <span className="text-sm text-yellow-800">Erro de sincronização</span>
        {showActions && erro.tipo === 'calendar_sync' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleTentarNovamente}
            disabled={tentarNovamente.isPending}
            className="ml-auto"
          >
            {tentarNovamente.isPending ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={getVariantBadge(erro.tipo) as any}>
                {getTipoLabel(erro.tipo)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(erro.data_ocorrencia), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
              {(erro.tentativas_retry || 0) > 0 && (
                <Badge variant="outline" className="text-xs">
                  {erro.tentativas_retry} tentativas
                </Badge>
              )}
            </div>
            <p className="text-sm text-foreground">{erro.mensagem_erro}</p>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 pt-2">
            {erro.tipo === 'calendar_sync' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleTentarNovamente}
                disabled={tentarNovamente.isPending}
              >
                {tentarNovamente.isPending ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Tentando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Tentar Novamente
                  </>
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleMarcarResolvido}
              disabled={marcarResolvido.isPending}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Marcar como Resolvido
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}