
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePlanos, useCreateCheckoutSession, usePacientesLimit } from '@/hooks/usePlanos';
import { Crown, CreditCard, Calendar, Users, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function PagamentosConfig() {
  const { data: planData, isLoading, refetch } = usePlanos();
  const { data: limitData } = usePacientesLimit();
  const createCheckoutSession = useCreateCheckoutSession();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const isPro = planData?.plano === 'pro';
  const isActive = planData?.subscription_status === 'active';

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      await createCheckoutSession();
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Erro ao iniciar processo de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ['pacientes-limit'] });
    toast.success('Status atualizado!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pagamentos e Planos</h2>
        <p className="text-gray-600 mt-1">
          Gerencie sua assinatura e planos de pagamento
        </p>
      </div>

      {/* Status do Plano Atual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <CardTitle>Plano Atual</CardTitle>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Status
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Plano:</span>
            <Badge variant={isPro ? "default" : "secondary"} className="text-sm">
              {isPro ? 'PROFISSIONAL' : 'GRATUITO'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <Badge 
              variant={isActive ? "default" : "destructive"} 
              className="text-sm"
            >
              {isActive ? 'ATIVO' : 'INATIVO'}
            </Badge>
          </div>

          {planData?.subscription_end_date && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Próxima renovação:</span>
              <span className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(planData.subscription_end_date).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="font-medium">Limite de pacientes:</span>
            <span className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-1" />
              {limitData?.count || 0} / {limitData?.limit || 0}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Plano Profissional */}
      <Card className={isPro ? "border-green-200 bg-green-50" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                <span>Plano Profissional</span>
                {isPro && <Badge className="bg-green-600">Atual</Badge>}
              </CardTitle>
              <CardDescription>
                Acesso completo a todas as funcionalidades da plataforma
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">R$ 399</div>
              <div className="text-sm text-gray-600">/mês</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Pacientes ilimitados
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Agendamentos ilimitados
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Prontuários digitais
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Relatórios avançados
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Suporte prioritário
            </li>
          </ul>

          <Separator />

          {!isPro ? (
            <Button 
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {loading ? 'Processando...' : 'Assinar Plano Profissional'}
            </Button>
          ) : (
            <div className="text-center">
              <Button 
                onClick={handleUpgrade}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Gerenciar Assinatura
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plano Gratuito */}
      <Card className={!isPro ? "border-blue-200 bg-blue-50" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Plano Gratuito</span>
            {!isPro && <Badge variant="secondary">Atual</Badge>}
          </CardTitle>
          <CardDescription>
            Ideal para começar com funcionalidades básicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Até 2 pacientes
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Agendamentos básicos
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              <span className="text-gray-500">Prontuários limitados</span>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
              <span className="text-gray-500">Relatórios básicos</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
