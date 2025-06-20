
import { PacienteForm } from './PacienteForm';
import { usePacientesLimit } from '@/hooks/usePlanos';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import { useCreateCheckoutSession } from '@/hooks/usePlanos';
import { useState } from 'react';
import { toast } from 'sonner';

interface PacienteFormWithLimitProps {
  paciente?: any;
  onSuccess?: () => void;
}

export function PacienteFormWithLimit({ paciente, onSuccess }: PacienteFormWithLimitProps) {
  const { data: limitData } = usePacientesLimit();
  const createCheckoutSession = useCreateCheckoutSession();
  const [loading, setLoading] = useState(false);

  const isEditing = !!paciente;
  const isAtLimit = limitData?.isAtLimit && !isEditing;

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

  if (isAtLimit) {
    return (
      <div className="space-y-4">
        <Alert className="border-orange-200 bg-orange-50">
          <Crown className="h-4 w-4 text-orange-600" />
          <AlertDescription className="space-y-3">
            <p className="text-orange-800">
              Você atingiu o limite de {limitData?.limit} pacientes no plano gratuito.
            </p>
            <p className="text-orange-700 text-sm">
              Para cadastrar mais pacientes, faça upgrade para o Plano Profissional e tenha acesso ilimitado.
            </p>
            <Button 
              onClick={handleUpgrade}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Carregando...' : 'Assinar Plano Profissional'}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <PacienteForm paciente={paciente} onSuccess={onSuccess} />;
}
