import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { User, Building, Users, Save, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { PerfilBasico } from '@/components/configuracoes/PerfilBasico';
import { InformacoesProfissionais } from '@/components/configuracoes/InformacoesProfissionais';
import { ServicosPrecos } from '@/components/configuracoes/ServicosPrecos';
import { GerenciarEquipe } from '@/components/configuracoes/GerenciarEquipe';
import { ConfiguracoesSistema } from '@/components/configuracoes/ConfiguracoesSistema';
import { ConfiguracaoClinica } from '@/components/configuracoes/ConfiguracaoClinica';
import { PagamentosConfig } from '@/components/configuracoes/PagamentosConfig';

export default function Configuracoes() {
  const { userProfile, profissional, isAdmin, updateProfissional } = useAuth();
  const [loading, setLoading] = useState(false);

  // Estado para dados do perfil profissional
  const [profileData, setProfileData] = useState({
    nome: profissional?.nome || '',
    especialidade: profissional?.especialidade || '',
    crm_cro: profissional?.crm_cro || '',
    telefone: profissional?.telefone || '',
    mini_bio: profissional?.mini_bio || '',
    servicos_oferecidos: (profissional?.servicos_oferecidos as string[]) || [],
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

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      if (profissional) {
        const updateData = {
          ...profileData,
          planos_saude: profileData.planos_saude.split(',').map(p => p.trim()).filter(p => p),
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

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-600 mt-1">
          Gerencie as configurações da clínica e seu perfil
        </p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="pagamentos">
            <CreditCard className="mr-2 h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="sistema">
            Sistema
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
          <GerenciarEquipe isAdmin={isAdmin} />
        </TabsContent>

        {/* Nova Aba Pagamentos */}
        <TabsContent value="pagamentos">
          <PagamentosConfig />
        </TabsContent>

        {/* Aba Sistema */}
        <TabsContent value="sistema">
          <ConfiguracoesSistema />
        </TabsContent>
      </Tabs>
    </div>
  );
}
