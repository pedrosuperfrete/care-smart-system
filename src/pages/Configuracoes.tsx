
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { User, Building, Users, Save, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { PerfilBasico } from '@/components/configuracoes/PerfilBasico';
import { InformacoesProfissionais } from '@/components/configuracoes/InformacoesProfissionais';
import { ServicosPrecos } from '@/components/configuracoes/ServicosPrecos';
import { GerenciarEquipe } from '@/components/configuracoes/GerenciarEquipe';
import { ConfiguracoesSistema } from '@/components/configuracoes/ConfiguracoesSistema';
import { ConfiguracaoClinica } from '@/components/configuracoes/ConfiguracaoClinica';
import { AssinaturaStatus } from '@/components/configuracoes/AssinaturaStatus';
import { ConfiguracaoWhatsApp } from '@/components/configuracoes/ConfiguracaoWhatsApp';

export default function Configuracoes() {
  const { userProfile, profissional, isAdmin, isRecepcionista, updateProfissional } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'perfil';
  });

  // Estado para dados do perfil profissional
  const [profileData, setProfileData] = useState({
    nome: profissional?.nome || '',
    especialidade: profissional?.especialidade || '',
    crm_cro: profissional?.crm_cro || '',
    telefone: profissional?.telefone || '',
    mini_bio: profissional?.mini_bio || '',
    servicos_oferecidos: (profissional?.servicos_oferecidos as string[]) || [],
    nome_clinica: profissional?.nome_clinica || '',
    horarios_atendimento: profissional?.horarios_atendimento || {},
    servicos_precos: (profissional?.servicos_precos as Array<{nome: string, preco: string}>) || [],
    formas_pagamento: (profissional?.formas_pagamento as string[]) || [],
    planos_saude: (profissional?.planos_saude as string[]) || [],
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      if (profissional) {
        const updateData = {
          ...profileData,
          planos_saude: profileData.planos_saude,
        };
        await updateProfissional(updateData);
      }
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
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

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-600 mt-1">
          Gerencie as configurações da clínica e seu perfil
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${isRecepcionista ? 'grid-cols-4' : 'grid-cols-6'}`}>
          <TabsTrigger value="perfil">
            <User className="mr-2 h-4 w-4" />
            Perfil
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="clinica">
              <Building className="mr-2 h-4 w-4" />
              Clínica
            </TabsTrigger>
          )}
          <TabsTrigger value="equipe">
            <Users className="mr-2 h-4 w-4" />
            Equipe
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            WhatsApp
          </TabsTrigger>
          {!isRecepcionista && (
            <TabsTrigger value="sistema">
              Sistema
            </TabsTrigger>
          )}
          <TabsTrigger value="assinatura">
            <Crown className="mr-2 h-4 w-4" />
            Assinatura
          </TabsTrigger>
        </TabsList>

        {/* Aba Perfil */}
        <TabsContent value="perfil">
          <div className="space-y-6">
            <PerfilBasico 
              userProfile={userProfile}
              profissional={profissional}
              profileData={profileData}
              setProfileData={setProfileData}
            />

            {profissional && (
              <>
                <InformacoesProfissionais
                  profileData={profileData}
                  setProfileData={setProfileData}
                  handleServicoChange={handleServicoChange}
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
                />
              </>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Aba Clínica (apenas para admin) */}
        {isAdmin && (
          <TabsContent value="clinica">
            <ConfiguracaoClinica />
          </TabsContent>
        )}

        {/* Aba Equipe */}
        <TabsContent value="equipe">
          <GerenciarEquipe />
        </TabsContent>

        {/* Aba WhatsApp */}
        <TabsContent value="whatsapp">
          <ConfiguracaoWhatsApp />
        </TabsContent>

        {/* Aba Sistema (não para recepcionistas) */}
        {!isRecepcionista && (
          <TabsContent value="sistema">
            <ConfiguracoesSistema />
          </TabsContent>
        )}

        {/* Aba Assinatura */}
        <TabsContent value="assinatura">
          <AssinaturaStatus />
        </TabsContent>
      </Tabs>
    </div>
  );
}
