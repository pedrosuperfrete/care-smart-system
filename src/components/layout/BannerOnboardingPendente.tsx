import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function BannerOnboardingPendente() {
  const { profissional, isProfissional } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Mostra banner apenas se:
  // - É profissional
  // - Onboarding não foi completado
  // - Onboarding foi adiado
  const onboardingAdiado = profissional?.onboarding_adiado_em != null;
  const onboardingIncompleto = !profissional?.onboarding_completo;
  
  const shouldShow = isProfissional && onboardingIncompleto && onboardingAdiado && !dismissed;

  if (!shouldShow) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-medium">Seu perfil está incompleto.</span>{' '}
            Complete seu cadastro para aproveitar todos os recursos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
            onClick={() => navigate('/app/configuracoes')}
          >
            Completar perfil
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
