
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Crown, X } from 'lucide-react';
import { useCreateCheckoutSession } from '@/hooks/usePlanos';
import { useState } from 'react';
import { toast } from 'sonner';

interface SubscriptionBannerProps {
  onDismiss: () => void;
}

export function SubscriptionBanner({ onDismiss }: SubscriptionBannerProps) {
  const createCheckoutSession = useCreateCheckoutSession();
  const [loading, setLoading] = useState(false);

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

  return (
    <Alert className="border-orange-200 bg-orange-50 mb-6">
      <Crown className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-orange-800">
          Você atingiu o limite de pacientes no plano gratuito. Para cadastrar mais, assine o plano profissional.
        </span>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleUpgrade}
            disabled={loading}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? 'Carregando...' : 'Assinar Plano Profissional'}
          </Button>
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="text-orange-600 hover:text-orange-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
