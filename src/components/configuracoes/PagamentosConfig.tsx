
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePlanos, useLimitePacientes } from '@/hooks/usePlanos';
import { CreditCard, ExternalLink, Crown } from 'lucide-react';

export function PagamentosConfig() {
  const { planoInfo, paymentHistory, createCheckoutSession, createCustomerPortal } = usePlanos();
  const { contadorPacientes, limitePacientes, planoAtual } = useLimitePacientes();

  const handleUpgrade = () => {
    createCheckoutSession.mutate('price_1RbqlPH56oqrru1DGeZDWA6b');
  };

  const handleManageBilling = () => {
    createCustomerPortal.mutate();
  };

  const isProPlan = planoAtual === 'pro';

  return (
    <div className="space-y-6">
      {/* Plano Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="mr-2 h-5 w-5" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                {isProPlan ? 'Plano Profissional' : 'Plano Gratuito'}
                <Badge variant={isProPlan ? 'default' : 'secondary'} className="ml-2">
                  {isProPlan ? 'PRO' : 'FREE'}
                </Badge>
              </h3>
              <p className="text-gray-600">
                {isProPlan ? 'R$ 399/mês' : 'Gratuito'}
              </p>
            </div>
            {!isProPlan && (
              <Button onClick={handleUpgrade} disabled={createCheckoutSession.isPending}>
                <Crown className="mr-2 h-4 w-4" />
                {createCheckoutSession.isPending ? 'Carregando...' : 'Fazer Upgrade'}
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
          </div>

          {isProPlan && planoInfo?.subscription_status === 'active' && (
            <div className="space-y-2">
              {planoInfo.subscription_end_date && (
                <p className="text-sm text-gray-600">
                  Próxima renovação: {new Date(planoInfo.subscription_end_date).toLocaleDateString('pt-BR')}
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
