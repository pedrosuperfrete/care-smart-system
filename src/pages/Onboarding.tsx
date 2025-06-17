
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { OnboardingStep1 } from '@/components/onboarding/OnboardingStep1';
import { OnboardingStep2 } from '@/components/onboarding/OnboardingStep2';

export default function Onboarding() {
  const { profissional, updateProfissional } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [step1Data, setStep1Data] = useState({
    nome: profissional?.nome || '',
    mini_bio: profissional?.mini_bio || '',
    servicos_oferecidos: (profissional?.servicos_oferecidos as string[]) || [],
  });

  const [step2Data, setStep2Data] = useState({
    nome_clinica: profissional?.nome_clinica || '',
    horarios_atendimento: typeof profissional?.horarios_atendimento === 'string' 
      ? profissional.horarios_atendimento 
      : '',
    servicos_precos: (profissional?.servicos_precos as Array<{nome: string, preco: string}>) || [],
    formas_pagamento: (profissional?.formas_pagamento as string[]) || [],
    planos_saude: typeof profissional?.planos_saude === 'string' 
      ? profissional.planos_saude 
      : (profissional?.planos_saude as string[])?.join(', ') || '',
  });

  const handleStep1Next = () => {
    setCurrentStep(2);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);

    try {
      const completeData = {
        nome: step1Data.nome,
        mini_bio: step1Data.mini_bio,
        servicos_oferecidos: step1Data.servicos_oferecidos,
        nome_clinica: step2Data.nome_clinica,
        horarios_atendimento: step2Data.horarios_atendimento,
        servicos_precos: step2Data.servicos_precos,
        formas_pagamento: step2Data.formas_pagamento,
        planos_saude: step2Data.planos_saude.split(',').map(p => p.trim()).filter(p => p),
        onboarding_completo: true,
      };

      await updateProfissional(completeData);
      toast.success('Onboarding completado com sucesso!');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao salvar dados. Tente novamente.');
      console.error('Erro no onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {currentStep === 1 ? (
        <OnboardingStep1
          data={step1Data}
          onDataChange={setStep1Data}
          onNext={handleStep1Next}
        />
      ) : (
        <OnboardingStep2
          data={step2Data}
          onDataChange={setStep2Data}
          onSubmit={handleFinalSubmit}
          onBack={handleStep2Back}
          loading={loading}
        />
      )}
    </div>
  );
}
