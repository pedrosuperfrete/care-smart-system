import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, CreditCard, ExternalLink, Loader2, Users, UserPlus } from 'lucide-react';
import { useAssinatura, useCreateCheckout, useCustomerPortal } from '@/hooks/useAssinatura';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PLANOS = [
  {
    id: 'profissional',
    nome: '1 Profissional',
    descricao: 'Ideal para consultórios individuais',
    precoMensal: 399,
    precoAnual: 3990,
    features: ['Agenda completa', 'Relatórios financeiros', 'Integração Google Calendar', 'Prontuários ilimitados'],
  },
  {
    id: 'profissional_secretaria',
    nome: '1 Profissional + 1 Secretária',
    descricao: 'Para consultórios com suporte administrativo',
    precoMensal: 799,
    precoAnual: 7990,
    features: ['Tudo do plano anterior', '+1 acesso de secretária', 'Gestão de equipe'],
  },
  {
    id: 'profissional_adicional',
    nome: 'Profissional Adicional',
    descricao: 'Adicione mais profissionais à sua clínica',
    precoMensal: 249,
    precoAnual: 2490,
    features: ['Cada profissional adicional', 'Agenda independente', 'Relatórios individuais'],
    isAddon: true,
  },
];

export function AssinaturaStatus() {
  const { isRecepcionista } = useAuth();
  const { data: assinatura, isLoading: loadingAssinatura, refetch } = useAssinatura();
  const createCheckout = useCreateCheckout();
  const customerPortal = useCustomerPortal();

  const handleAssinar = (planType?: string) => {
    createCheckout.mutate(planType);
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
    <div className="space-y-6">
      {/* Status atual */}
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

          <div className="flex gap-2 pt-4">
            {!isRecepcionista && assinatura?.assinatura_ativa && (
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
            )}
            
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={loadingAssinatura}
              className={assinatura?.assinatura_ativa || isRecepcionista ? "flex-1" : ""}
            >
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Planos disponíveis - só mostra se não tem assinatura ativa */}
      {!assinatura?.assinatura_ativa && !isRecepcionista && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Escolha seu plano</h3>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PLANOS.map((plano) => (
              <Card key={plano.id} className={plano.isAddon ? 'border-dashed' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {plano.isAddon ? (
                      <UserPlus className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Users className="h-5 w-5 text-primary" />
                    )}
                    <CardTitle className="text-base">{plano.nome}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">{plano.descricao}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">R$ {plano.precoMensal}</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ou R$ {plano.precoAnual.toLocaleString('pt-BR')}/ano
                      <span className="text-primary font-medium ml-1">(2 meses grátis)</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      12x de R$ {(plano.precoAnual / 12).toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  <ul className="space-y-1 text-sm">
                    {plano.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-primary">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {!plano.isAddon && (
                    <Button 
                      onClick={() => handleAssinar(plano.id)}
                      disabled={createCheckout.isPending}
                      className="w-full"
                      variant={plano.id === 'profissional_secretaria' ? 'default' : 'outline'}
                    >
                      {createCheckout.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="mr-2 h-4 w-4" />
                      )}
                      Assinar
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Todos os planos incluem: pacientes ilimitados, suporte prioritário e atualizações gratuitas.
          </p>
        </div>
      )}
    </div>
  );
}
