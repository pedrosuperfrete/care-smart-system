
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
    horarios_atendimento: profissional?.horarios_atendimento || {},
    servicos_precos: (profissional?.servicos_precos as Array<{nome: string, preco: string}>) || [],
    formas_pagamento: (profissional?.formas_pagamento as string[]) || [],
    planos_saude: (profissional?.planos_saude as string[]) || [],
  });

  const handleStep1Next = () => {
    setCurrentStep(2);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    
    console.log('=== INÍCIO DO ONBOARDING SUBMIT ===');
    console.log('Step1Data:', step1Data);
    console.log('Step2Data:', step2Data);
    console.log('Profissional atual:', profissional);

    try {
      let clinicaId = profissional?.clinica_id;
      console.log('ClinicaId encontrada:', clinicaId);

      // Verificar se há dados obrigatórios
      if (!step2Data.nome_clinica || !step2Data.cnpj_clinica) {
        console.error('Dados obrigatórios da clínica não preenchidos:', {
          nome: step2Data.nome_clinica,
          cnpj: step2Data.cnpj_clinica
        });
        toast.error('Por favor, preencha o nome e CNPJ da clínica');
        return;
      }

      // Se existe clinicaId, SEMPRE atualizar (independente se é temporária ou não)
      if (clinicaId) {
        console.log('Atualizando clínica existente com ID:', clinicaId);
        const { error: clinicaError } = await supabase
          .from('clinicas')
          .update({
            nome: step2Data.nome_clinica,
            cnpj: step2Data.cnpj_clinica,
            endereco: step2Data.endereco_clinica || null,
          })
          .eq('id', clinicaId);

        if (clinicaError) {
          console.error('Erro ao atualizar clínica:', clinicaError);
          toast.error('Erro ao atualizar clínica: ' + clinicaError.message);
          return;
        }

        console.log('Clínica atualizada com sucesso!');
        toast.success('Clínica atualizada com sucesso!');
      } else {
        // Criar nova clínica apenas se não existe nenhuma
        console.log('Criando nova clínica...');
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
          console.error('Erro ao criar clínica:', clinicaError);
          toast.error('Erro ao criar clínica: ' + clinicaError.message);
          return;
        }

        clinicaId = clinicaData.id;
        console.log('Nova clínica criada com ID:', clinicaId);

        // Atualizar associação do usuário para a nova clínica
        const { error: associacaoError } = await supabase
          .from('usuarios_clinicas')
          .update({
            clinica_id: clinicaId,
            tipo_papel: 'profissional'
          })
          .eq('usuario_id', user?.id);

        if (associacaoError) {
          console.error('Erro ao atualizar associação:', associacaoError);
          toast.error('Erro ao associar usuário à clínica: ' + associacaoError.message);
          return;
        }

        console.log('Associação atualizada com sucesso!');
        toast.success('Nova clínica criada com sucesso!');
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
        planos_saude: step2Data.planos_saude,
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
