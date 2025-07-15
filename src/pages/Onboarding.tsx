
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { OnboardingStep1 } from '@/components/onboarding/OnboardingStep1';
import { OnboardingStep2 } from '@/components/onboarding/OnboardingStep2';
import { supabase } from '@/integrations/supabase/client';

export default function Onboarding() {
  const { user, profissional, updateProfissional } = useAuth();
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
    cnpj_clinica: '',
    endereco_clinica: '',
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
      let clinicaId = profissional?.clinica_id;
      let isClinicaTemporaria = false;

      // Verificar se a clínica atual é temporária
      if (clinicaId) {
        const { data: clinicaAtual } = await supabase
          .from('clinicas')
          .select('cnpj, nome')
          .eq('id', clinicaId)
          .single();
        
        isClinicaTemporaria = clinicaAtual?.cnpj?.startsWith('temp-') || clinicaAtual?.nome === 'Clínica Temporária';
      }

      if (isClinicaTemporaria && clinicaId) {
        // Atualizar a clínica temporária existente
        const { error: clinicaError } = await supabase
          .from('clinicas')
          .update({
            nome: step2Data.nome_clinica,
            cnpj: step2Data.cnpj_clinica,
            endereco: step2Data.endereco_clinica || null,
          })
          .eq('id', clinicaId);

        if (clinicaError) {
          toast.error('Erro ao atualizar clínica: ' + clinicaError.message);
          return;
        }
      } else {
        // Criar nova clínica se não existe uma temporária
        const { data: clinicaData, error: clinicaError } = await supabase
          .from('clinicas')
          .insert({
            nome: step2Data.nome_clinica,
            cnpj: step2Data.cnpj_clinica,
            endereco: step2Data.endereco_clinica || null,
          })
          .select()
          .single();

        if (clinicaError) {
          toast.error('Erro ao criar clínica: ' + clinicaError.message);
          return;
        }

        clinicaId = clinicaData.id;

        // Atualizar associação do usuário para a nova clínica
        const { error: associacaoError } = await supabase
          .from('usuarios_clinicas')
          .update({
            clinica_id: clinicaId,
            tipo_papel: 'admin_clinica'
          })
          .eq('usuario_id', user?.id);

        if (associacaoError) {
          console.error('Erro ao atualizar associação:', associacaoError);
        }
      }

      // Atualizar dados do profissional
      const completeData = {
        nome: step1Data.nome,
        mini_bio: step1Data.mini_bio,
        servicos_oferecidos: step1Data.servicos_oferecidos,
        nome_clinica: step2Data.nome_clinica,
        clinica_id: clinicaId,
        horarios_atendimento: step2Data.horarios_atendimento,
        servicos_precos: step2Data.servicos_precos,
        formas_pagamento: step2Data.formas_pagamento,
        planos_saude: step2Data.planos_saude.split(',').map(p => p.trim()).filter(p => p),
        onboarding_completo: true,
      };

      await updateProfissional(completeData);
      toast.success('Sua clínica foi criada com sucesso!');
      navigate('/app/dashboard');
    } catch (error) {
      toast.error('Erro ao criar clínica. Tente novamente.');
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
