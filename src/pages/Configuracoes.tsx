
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { User, Building, Users, Save, Trash2, UserPlus, Plus } from 'lucide-react';
import { toast } from 'sonner';

const servicosDisponiveis = [
  'Consulta presencial',
  'Teleconsulta',
  'Psicologia',
  'Nutricionista',
  'Atendimento domiciliar',
  'Retorno',
  'Exames clínicos',
  'Sessões de psicoterapia'
];

const formasPagamentoDisponiveis = [
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Transferência Bancária'
];

export default function Configuracoes() {
  const { userProfile, profissional, isAdmin, updateProfile, updateProfissional } = useAuth();
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

  // Mock data para usuários (para admin)
  const usuarios = [
    {
      id: '1',
      email: 'dr.joao@clinica.com',
      tipo: 'profissional',
      ativo: true,
      nome: 'Dr. João Silva',
      especialidade: 'Cardiologia'
    },
    {
      id: '2',
      email: 'maria@clinica.com',
      tipo: 'recepcionista',
      ativo: true,
      nome: 'Maria Santos',
      especialidade: null
    }
  ];

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
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="sistema">
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Aba Perfil */}
        <TabsContent value="perfil">
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Suas informações pessoais e de conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={userProfile?.email || ''} disabled />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo de Usuário</Label>
                    <Input value={userProfile?.tipo_usuario || ''} disabled />
                  </div>

                  {profissional && (
                    <>
                      <div className="space-y-2">
                        <Label>Nome Completo</Label>
                        <Input 
                          value={profileData.nome}
                          onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })}
                          placeholder="Seu nome completo"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Especialidade</Label>
                        <Input 
                          value={profileData.especialidade}
                          onChange={(e) => setProfileData({ ...profileData, especialidade: e.target.value })}
                          placeholder="Sua especialidade"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>CRM/CRO</Label>
                        <Input 
                          value={profileData.crm_cro}
                          onChange={(e) => setProfileData({ ...profileData, crm_cro: e.target.value })}
                          placeholder="Seu registro profissional"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input 
                          value={profileData.telefone}
                          onChange={(e) => setProfileData({ ...profileData, telefone: e.target.value })}
                          placeholder="Seu telefone"
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações Profissionais */}
            {profissional && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Informações Profissionais</CardTitle>
                    <CardDescription>
                      Suas informações profissionais e de apresentação
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Mini Bio</Label>
                      <Textarea
                        value={profileData.mini_bio}
                        onChange={(e) => setProfileData({ ...profileData, mini_bio: e.target.value })}
                        placeholder="Conte um pouco sobre você e sua experiência profissional..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Nome da Clínica</Label>
                      <Input
                        value={profileData.nome_clinica}
                        onChange={(e) => setProfileData({ ...profileData, nome_clinica: e.target.value })}
                        placeholder="Nome que será exibido aos pacientes"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Horários de Atendimento</Label>
                      <Textarea
                        value={profileData.horarios_atendimento}
                        onChange={(e) => setProfileData({ ...profileData, horarios_atendimento: e.target.value })}
                        placeholder="Ex: Segunda a Sexta: 8h às 18h&#10;Sábado: 8h às 12h"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label>Serviços Oferecidos</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {servicosDisponiveis.map((servico) => (
                          <div key={servico} className="flex items-center space-x-2">
                            <Checkbox
                              id={servico}
                              checked={profileData.servicos_oferecidos.includes(servico)}
                              onCheckedChange={(checked) => handleServicoChange(servico, !!checked)}
                            />
                            <Label
                              htmlFor={servico}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {servico}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Serviços e Preços</CardTitle>
                    <CardDescription>
                      Configure os serviços que você oferece e seus respectivos preços
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Serviços com Preços</Label>
                        <Button type="button" onClick={addServicoPreco} size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                      
                      {profileData.servicos_precos.map((servico, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex-1">
                            <Input
                              placeholder="Nome do serviço"
                              value={servico.nome}
                              onChange={(e) => updateServicoPreco(index, 'nome', e.target.value)}
                            />
                          </div>
                          <div className="w-32">
                            <Input
                              placeholder="R$ 0,00"
                              value={servico.preco}
                              onChange={(e) => updateServicoPreco(index, 'preco', e.target.value)}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => removeServicoPreco(index)}
                            size="sm"
                            variant="outline"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <Label>Formas de Pagamento Aceitas</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {formasPagamentoDisponiveis.map((forma) => (
                          <div key={forma} className="flex items-center space-x-2">
                            <Checkbox
                              id={forma}
                              checked={profileData.formas_pagamento.includes(forma)}
                              onCheckedChange={(checked) => handleFormaPagamentoChange(forma, !!checked)}
                            />
                            <Label
                              htmlFor={forma}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {forma}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Planos de Saúde Aceitos</Label>
                      <Textarea
                        value={profileData.planos_saude}
                        onChange={(e) => setProfileData({ ...profileData, planos_saude: e.target.value })}
                        placeholder="Lista os planos de saúde que você aceita (separados por vírgula)"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
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
            <Card>
              <CardHeader>
                <CardTitle>Informações da Clínica</CardTitle>
                <CardDescription>
                  Configure os dados básicos da sua clínica
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Clínica</Label>
                    <Input placeholder="Nome da clínica" />
                  </div>

                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input placeholder="00.000.000/0001-00" />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Endereço</Label>
                    <Textarea placeholder="Endereço completo da clínica" />
                  </div>

                  <div className="space-y-2">
                    <Label>Chave PIX</Label>
                    <Input placeholder="Chave PIX para recebimentos" />
                  </div>

                  <div className="space-y-2">
                    <Label>Conta Bancária</Label>
                    <Input placeholder="Dados da conta bancária" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Aba Equipe */}
        <TabsContent value="equipe">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciar Equipe</CardTitle>
                <CardDescription>
                  {isAdmin ? 'Gerencie os usuários e suas permissões' : 'Visualize a equipe da clínica'}
                </CardDescription>
              </div>
              
              {isAdmin && (
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Adicionar Usuário
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usuarios.map((usuario) => (
                  <div key={usuario.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-medium">{usuario.nome || usuario.email}</h4>
                          <p className="text-sm text-gray-600">{usuario.email}</p>
                          {usuario.especialidade && (
                            <p className="text-sm text-gray-500">{usuario.especialidade}</p>
                          )}
                        </div>
                        <Badge variant={usuario.tipo === 'admin' ? 'default' : 'secondary'}>
                          {usuario.tipo}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch checked={usuario.ativo} disabled={!isAdmin} />
                      {isAdmin && (
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Sistema */}
        <TabsContent value="sistema">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferências do Sistema</CardTitle>
                <CardDescription>
                  Configure as preferências gerais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-gray-600">
                      Receber notificações sobre agendamentos e lembretes
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Confirmação Automática</Label>
                    <p className="text-sm text-gray-600">
                      Confirmar automaticamente agendamentos via WhatsApp
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Backup Automático</Label>
                    <p className="text-sm text-gray-600">
                      Realizar backup dos dados diariamente
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zona de Perigo</CardTitle>
                <CardDescription>
                  Ações que afetam permanentemente os dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-800">Excluir Conta</h4>
                    <p className="text-sm text-red-600">
                      Excluir permanentemente sua conta e todos os dados
                    </p>
                  </div>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
