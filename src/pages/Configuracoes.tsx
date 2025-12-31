
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { User, Building, Users, Save, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { PerfilBasico } from '@/components/configuracoes/PerfilBasico';
import { GerenciarEquipe } from '@/components/configuracoes/GerenciarEquipe';
import { ConfiguracoesSistema } from '@/components/configuracoes/ConfiguracoesSistema';
import { ConfiguracaoClinica } from '@/components/configuracoes/ConfiguracaoClinica';
import { AssinaturaStatus } from '@/components/configuracoes/AssinaturaStatus';
import { ConfiguracaoWhatsApp } from '@/components/configuracoes/ConfiguracaoWhatsApp';
import { ConfiguracoesProfissional } from '@/components/configuracoes/ConfiguracoesProfissional';

export default function Configuracoes() {
  const { userProfile, profissional, isAdmin, isRecepcionista, updateProfissional } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'perfil';
  });

  // Estado para dados do perfil básico do usuário
  const [profileData, setProfileData] = useState({
    nome: profissional?.nome || '',
    especialidade: profissional?.especialidade || '',
    crm_cro: profissional?.crm_cro || '',
    telefone: profissional?.telefone || '',
    pix_chave: (profissional as any)?.pix_chave || '',
    conta_bancaria: (profissional as any)?.conta_bancaria || '',
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      if (profissional) {
        const updateData = {
          nome: profileData.nome,
          especialidade: profileData.especialidade,
          crm_cro: profileData.crm_cro,
          telefone: profileData.telefone?.trim() ? profileData.telefone.trim() : null,
          pix_chave: profileData.pix_chave?.trim() ? profileData.pix_chave.trim() : null,
          conta_bancaria: profileData.conta_bancaria?.trim() ? profileData.conta_bancaria.trim() : null,
        };

        await updateProfissional(updateData);
      }
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error?.message ? `Erro ao atualizar perfil: ${error.message}` : 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Determinar número de colunas do grid baseado nos acessos
  const getGridCols = () => {
    if (isRecepcionista) return 'grid-cols-4'; // Perfil, Clínica, Equipe, WhatsApp
    if (isAdmin || profissional) return 'grid-cols-6'; // Todas as abas
    return 'grid-cols-4';
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
        <TabsList className={`grid w-full ${getGridCols()}`}>
          <TabsTrigger value="perfil">
            <User className="mr-2 h-4 w-4" />
            Perfil
          </TabsTrigger>
          {/* Clínica visível para Admin, Profissionais e Secretárias */}
          {(isAdmin || profissional || isRecepcionista) && (
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
          {!isRecepcionista && (
            <TabsTrigger value="assinatura">
              <Crown className="mr-2 h-4 w-4" />
              Assinatura
            </TabsTrigger>
          )}
        </TabsList>

        {/* Aba Perfil - Apenas informações básicas do próprio usuário */}
        <TabsContent value="perfil">
          <div className="space-y-6">
            <PerfilBasico 
              userProfile={userProfile}
              profissional={profissional}
              profileData={profileData}
              setProfileData={setProfileData}
            />

            {profissional && (
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Aba Clínica - Configurações da clínica e profissionais */}
        {(isAdmin || profissional || isRecepcionista) && (
          <TabsContent value="clinica">
            <div className="space-y-6">
              {/* Configurações gerais da clínica (apenas para admin/profissional) */}
              {(isAdmin || profissional) && !isRecepcionista && (
                <ConfiguracaoClinica />
              )}

              {/* Configurações dos profissionais */}
              <ConfiguracoesProfissional />
            </div>
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

        {/* Aba Assinatura (não para recepcionistas) */}
        {!isRecepcionista && (
          <TabsContent value="assinatura">
            <AssinaturaStatus />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
