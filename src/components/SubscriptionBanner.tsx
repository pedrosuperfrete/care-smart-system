
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown } from 'lucide-react';
import { useLimitePacientes } from '@/hooks/usePlanos';
import { usePlanos } from '@/hooks/usePlanos';

export function SubscriptionBanner() {
  const { atingiuLimite, planoAtual, contadorPacientes } = useLimitePacientes();
  const { createCheckoutSession } = usePlanos();

  // Só mostra o banner se não for plano PRO e atingiu o limite
  if (!atingiuLimite || planoAtual === 'pro') {
    return null;
  }

  const handleUpgrade = () => {
    createCheckoutSession.mutate('price_1RbqlPH56oqrru1DGeZDWA6b');
  };

  return (
    <Alert className="bg-amber-50 border-amber-200 mb-4">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="text-amber-800">
          Você atingiu o limite de {contadorPacientes} pacientes no plano gratuito. Para cadastrar mais, assine o plano profissional.
        </span>
        <Button 
          onClick={handleUpgrade}
          disabled={createCheckoutSession.isPending}
          className="ml-4 bg-amber-600 hover:bg-amber-700"
        >
          <Crown className="mr-2 h-4 w-4" />
          {createCheckoutSession.isPending ? 'Carregando...' : 'Assinar Plano Profissional'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
