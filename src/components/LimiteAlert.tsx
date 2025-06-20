
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useLimitePacientes } from '@/hooks/usePlanos';
import { usePlanos } from '@/hooks/usePlanos';

export function LimiteAlert() {
  const { atingiuLimite, planoAtual } = useLimitePacientes();
  const { createCheckoutSession } = usePlanos();

  // Só mostra o alerta se for plano free e atingiu o limite
  if (!atingiuLimite || planoAtual === 'pro') {
    return null;
  }

  const handleUpgrade = () => {
    createCheckoutSession.mutate('price_1RbqlPH56oqrru1DGeZDWA6b');
  };

  return (
    <Alert className="bg-red-50 border-red-200 mb-4">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="text-red-800">
          Limite de pacientes atingido no plano gratuito. Para continuar cadastrando pacientes, faça upgrade para o plano Profissional.
        </span>
        <Button 
          onClick={handleUpgrade}
          variant="destructive"
          size="sm"
          className="ml-4"
          disabled={createCheckoutSession.isPending}
        >
          {createCheckoutSession.isPending ? 'Carregando...' : 'Assinar plano por R$ 399/mês'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
