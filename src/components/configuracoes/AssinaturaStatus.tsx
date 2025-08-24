import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { useAssinatura, useCreateCheckout, useCustomerPortal } from '@/hooks/useAssinatura';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AssinaturaStatus() {
  const { isRecepcionista } = useAuth();
  const { data: assinatura, isLoading: loadingAssinatura, refetch } = useAssinatura();
  const createCheckout = useCreateCheckout();
  const customerPortal = useCustomerPortal();

  const handleAssinar = () => {
    createCheckout.mutate();
  };

  const handleGerenciar = () => {
    customerPortal.mutate();
  };

  if (loadingAssinatura) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Status da Assinatura
        </CardTitle>
        <CardDescription>
          {isRecepcionista 
            ? "Visualize o status da assinatura da clínica"
            : "Gerencie sua assinatura da plataforma Donee"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Status</p>
            <Badge variant={assinatura?.assinatura_ativa ? "default" : "secondary"}>
              {assinatura?.assinatura_ativa ? "Ativa" : "Inativa"}
            </Badge>
          </div>
          
          {assinatura?.data_vencimento && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Próxima Cobrança</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(assinatura.data_vencimento), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="space-y-2">
            <h4 className="font-medium">Plano Anual - R$ 1.000,00</h4>
            <p className="text-sm text-muted-foreground">
              • Pacientes ilimitados
              • Agenda completa
              • Relatórios financeiros
              • Integração com Google Calendar
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          {!isRecepcionista && (
            <>
              {assinatura?.assinatura_ativa ? (
                <Button 
                  onClick={handleGerenciar}
                  disabled={customerPortal.isPending}
                  className="flex-1"
                >
                  {customerPortal.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Gerenciar Assinatura
                </Button>
              ) : (
                <Button 
                  onClick={handleAssinar}
                  disabled={createCheckout.isPending}
                  className="flex-1"
                >
                  {createCheckout.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Assinar Agora
                </Button>
              )}
            </>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={loadingAssinatura}
            className={isRecepcionista ? "flex-1" : ""}
          >
            Atualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}