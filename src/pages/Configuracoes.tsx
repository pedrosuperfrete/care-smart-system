
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
import { useAuth } from '@/hooks/useAuth';
import { User, Building, Users, Save, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function Configuracoes() {
  const { userProfile, profissional, isAdmin, updateProfile, updateProfissional } = useAuth();
  const [loading, setLoading] = useState(false);

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

  const handleSaveProfile = async (data: any) => {
    setLoading(true);
    try {
      if (profissional) {
        await updateProfissional(data);
      } else {
        await updateProfile(data);
      }
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
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
          <Card>
            <CardHeader>
              <CardTitle>Meu Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e profissionais
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
                        defaultValue={profissional.nome || ''}
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Especialidade</Label>
                      <Input 
                        defaultValue={profissional.especialidade || ''}
                        placeholder="Sua especialidade"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>CRM/CRO</Label>
                      <Input 
                        defaultValue={profissional.crm_cro || ''}
                        placeholder="Seu registro profissional"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input 
                        defaultValue={profissional.telefone || ''}
                        placeholder="Seu telefone"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveProfile({})} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
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
