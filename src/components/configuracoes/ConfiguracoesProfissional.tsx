import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfissionais } from '@/hooks/useProfissionais';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InformacoesProfissionais } from './InformacoesProfissionais';
import { ServicosPrecos } from './ServicosPrecos';
import { Tables } from '@/integrations/supabase/types';

type Profissional = Tables<'profissionais'>;

export function ConfiguracoesProfissional() {
  const { profissional, isAdmin, isRecepcionista, updateProfissional } = useAuth();
  const { data: profissionais = [] } = useProfissionais();
  const [loading, setLoading] = useState(false);
  
  // Para admin/secretária, permitir selecionar profissional
  const podeGerenciarOutros = isAdmin || isRecepcionista;
  
  // Estado do profissional selecionado (para admin/secretária)
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string>('');
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  
  // Estado dos dados do profissional selecionado
  const [profileData, setProfileData] = useState({
    nome: '',
    especialidade: '',
    crm_cro: '',
    telefone: '',
    mini_bio: '',
    servicos_oferecidos: [] as string[],
    nome_clinica: '',
    horarios_atendimento: {} as any,
    servicos_precos: [] as Array<{nome: string, preco: string}>,
    formas_pagamento: [] as string[],
    planos_saude: [] as string[],
    pix_chave: '',
    conta_bancaria: '',
  });

  // Carregar dados do profissional selecionado
  useEffect(() => {
    if (podeGerenciarOutros) {
      // Admin/Secretária: carregar profissional selecionado
      if (selectedProfissionalId) {
        const prof = profissionais.find(p => p.id === selectedProfissionalId);
        if (prof) {
          setSelectedProfissional(prof);
          loadProfileData(prof);
        }
      } else if (profissionais.length > 0 && !selectedProfissionalId) {
        // Selecionar primeiro profissional por padrão
        setSelectedProfissionalId(profissionais[0].id);
      }
    } else if (profissional) {
      // Profissional: carregar apenas seus próprios dados
      setSelectedProfissional(profissional);
      loadProfileData(profissional);
    }
  }, [podeGerenciarOutros, selectedProfissionalId, profissionais, profissional]);

  const loadProfileData = (prof: Profissional) => {
    setProfileData({
      nome: prof.nome || '',
      especialidade: prof.especialidade || '',
      crm_cro: prof.crm_cro || '',
      telefone: prof.telefone || '',
      mini_bio: prof.mini_bio || '',
      servicos_oferecidos: (prof.servicos_oferecidos as string[]) || [],
      nome_clinica: prof.nome_clinica || '',
      horarios_atendimento: prof.horarios_atendimento || {},
      servicos_precos: (prof.servicos_precos as Array<{nome: string, preco: string}>) || [],
      formas_pagamento: (prof.formas_pagamento as string[]) || [],
      planos_saude: (prof.planos_saude as string[]) || [],
      pix_chave: (prof as any).pix_chave || '',
      conta_bancaria: (prof as any).conta_bancaria || '',
    });
  };

  const handleSave = async () => {
    if (!selectedProfissional) return;
    
    setLoading(true);
    try {
      const updateData = {
        mini_bio: profileData.mini_bio,
        servicos_oferecidos: profileData.servicos_oferecidos,
        nome_clinica: profileData.nome_clinica?.trim() ? profileData.nome_clinica.trim() : null,
        horarios_atendimento: profileData.horarios_atendimento,
        servicos_precos: profileData.servicos_precos,
        formas_pagamento: profileData.formas_pagamento,
        planos_saude: profileData.planos_saude,
      };

      if (podeGerenciarOutros) {
        // Admin/Secretária: atualizar diretamente no banco
        const { error } = await supabase
          .from('profissionais')
          .update(updateData)
          .eq('id', selectedProfissional.id);
        
        if (error) throw error;
      } else {
        // Profissional: usar função do contexto
        await updateProfissional(updateData);
      }
      
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error(error?.message ? `Erro ao salvar: ${error.message}` : 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleServicoChange = (servico: string, checked: boolean) => {
    const newServicos = checked 
      ? [...profileData.servicos_oferecidos, servico]
      : profileData.servicos_oferecidos.filter(s => s !== servico);
    setProfileData({ ...profileData, servicos_oferecidos: newServicos });
  };

  const handleFormaPagamentoChange = (forma: string, checked: boolean) => {
    const newFormas = checked 
      ? [...profileData.formas_pagamento, forma]
      : profileData.formas_pagamento.filter(f => f !== forma);
    setProfileData({ ...profileData, formas_pagamento: newFormas });
  };

  const addServicoPreco = () => {
    setProfileData({
      ...profileData,
      servicos_precos: [...profileData.servicos_precos, { nome: '', preco: '' }]
    });
  };

  const removeServicoPreco = (index: number) => {
    const newServicos = profileData.servicos_precos.filter((_, i) => i !== index);
    setProfileData({ ...profileData, servicos_precos: newServicos });
  };

  const updateServicoPreco = (index: number, field: 'nome' | 'preco', value: string) => {
    const newServicos = [...profileData.servicos_precos];
    newServicos[index][field] = value;
    setProfileData({ ...profileData, servicos_precos: newServicos });
  };

  const addPlanoSaude = () => {
    setProfileData({
      ...profileData,
      planos_saude: [...profileData.planos_saude, '']
    });
  };

  const removePlanoSaude = (index: number) => {
    const newPlanos = profileData.planos_saude.filter((_, i) => i !== index);
    setProfileData({ ...profileData, planos_saude: newPlanos });
  };

  const updatePlanoSaude = (index: number, value: string) => {
    const newPlanos = [...profileData.planos_saude];
    newPlanos[index] = value;
    setProfileData({ ...profileData, planos_saude: newPlanos });
  };

  // Se não há profissionais, mostrar mensagem
  if (profissionais.length === 0 && podeGerenciarOutros) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum profissional cadastrado na clínica.
        </CardContent>
      </Card>
    );
  }

  // Lista simplificada de profissionais para o dropdown
  const profissionaisSimples = profissionais.map(p => ({
    id: p.id,
    nome: p.nome,
    especialidade: p.especialidade
  }));

  return (
    <div className="space-y-6">
      {/* Configurações do Profissional Selecionado */}
      {selectedProfissional && (
        <>
          <InformacoesProfissionais
            profileData={profileData}
            setProfileData={setProfileData}
            handleServicoChange={handleServicoChange}
            podeGerenciarOutros={podeGerenciarOutros}
            profissionais={profissionaisSimples}
            selectedProfissionalId={selectedProfissionalId}
            onProfissionalChange={setSelectedProfissionalId}
          />

          <ServicosPrecos
            profileData={profileData}
            setProfileData={setProfileData}
            addServicoPreco={addServicoPreco}
            removeServicoPreco={removeServicoPreco}
            updateServicoPreco={updateServicoPreco}
            handleFormaPagamentoChange={handleFormaPagamentoChange}
            addPlanoSaude={addPlanoSaude}
            removePlanoSaude={removePlanoSaude}
            updatePlanoSaude={updatePlanoSaude}
            podeGerenciarOutros={podeGerenciarOutros}
            profissionais={profissionaisSimples}
            selectedProfissionalId={selectedProfissionalId}
            onProfissionalChange={setSelectedProfissionalId}
          />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
