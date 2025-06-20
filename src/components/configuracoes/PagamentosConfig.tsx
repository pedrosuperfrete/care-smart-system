
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePlanos, useLimitePacientes } from '@/hooks/usePlanos';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { CreditCard, ExternalLink, Crown, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function PagamentosConfig() {
  const { paymentHistory, createCheckoutSession, createCustomerPortal } = usePlanos();
  const { contadorPacientes, limitePacientes } = useLimitePacientes();
  const { data: subscriptionData, isLoading, refetch } = useSubscriptionStatus();

  const handleUpgrade = () => {
    createCheckoutSession.mutate('price_1RbqlPH56oqrru1DGeZDWA6b');
  };

  const handleManageBilling = () => {
    createCustomerPortal.mutate();
  };

  const handleRefreshStatus = () => {
    refetch();
  };

  const isProPlan = subscriptionData?.plano === 'pro';
  const isActive = subscriptionData?.subscription_status === 'active';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando informações da assinatura...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status da Assinatura */}
      <Alert className={isProPlan && isActive ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}>
        {isProPlan && isActive ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-blue-600" />
        )}
        <AlertDescription className={isProPlan && isActive ? "text-green-800" : "text-blue-800"}>
          {isProPlan && isActive 
            ? "Seu plano profissional está ativo e funcionando perfeitamente!"
            : "Você está no plano gratuito. Faça upgrade para desbloquear recursos ilimitados."
          }
        </AlertDescription>
      </Alert>

      {/* Plano Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="mr-2 h-5 w-5" />
              Plano Atual
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefreshStatus}
              disabled={isLoading}
            >
              Atualizar Status
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                {isProPlan ? 'Plano Profissional' : 'Plano Gratuito'}
                <Badge variant={isProPlan && isActive ? 'default' : 'secondary'} className="ml-2">
                  {isProPlan && isActive ? 'PRO' : 'FREE'}
                </Badge>
                {subscriptionData?.subscription_status && (
                  <Badge 
                    variant={isActive ? 'default' : 'destructive'} 
                    className="ml-2"
                  >
                    {subscriptionData.subscription_status.toUpperCase()}
                  </Badge>
                )}
              </h3>
              <p className="text-gray-600">
                {isProPlan ? 'R$ 399/mês' : 'Gratuito'}
              </p>
            </div>
            {!isProPlan && (
              <Button onClick={handleUpgrade} disabled={createCheckoutSession.isPending}>
                <Crown className="mr-2 h-4 w-4" />
                {createCheckoutSession.isPending ? 'Carregando...' : 'Assinar Plano Profissional'}
              </Button>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Limites do Plano</h4>
            <div className="flex items-center justify-between">
              <span>Pacientes cadastrados:</span>
              <span className="font-medium">
                {contadorPacientes} de {limitePacientes === Infinity ? '∞' : limitePacientes}
              </span>
            </div>
            {!isProPlan && contadorPacientes >= 2 && (
              <div className="mt-2 text-sm text-amber-600">
                ⚠️ Limite atingido. Faça upgrade para cadastrar mais pacientes.
              </div>
            )}
          </div>

          {isProPlan && isActive && (
            <div className="space-y-2">
              {subscriptionData.subscription_end_date && (
                <p className="text-sm text-gray-600">
                  Próxima renovação: {new Date(subscriptionData.subscription_end_date).toLocaleDateString('pt-BR')}
                </p>
              )}
              <Button 
                variant="outline" 
                onClick={handleManageBilling}
                disabled={createCustomerPortal.isPending}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {createCustomerPortal.isPending ? 'Carregando...' : 'Gerenciar Cobrança'}
              </Button>
            </div>
          )}

          {/* Debug Info (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-sm text-gray-500 cursor-pointer">Debug Info</summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(subscriptionData, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!paymentHistory || paymentHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhum pagamento encontrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentHistory.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: payment.currency || 'BRL'
                      }).format(payment.amount || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                        {payment.status === 'paid' ? 'Pago' : payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {payment.payment_method || 'Card'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
