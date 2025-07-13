import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, UserMinus, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUsuariosClinicas, useCreateUsuarioClinica, useRemoveUsuarioClinica } from '@/hooks/useUsuariosClinicas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NovoUsuarioForm {
  email: string;
  tipo_papel: 'admin_clinica' | 'profissional' | 'recepcionista';
}

export function GerenciarEquipe() {
  const { isAdminClinica, clinicaAtual } = useAuth();
  const [novoUsuario, setNovoUsuario] = useState<NovoUsuarioForm>({ email: '', tipo_papel: 'recepcionista' });
  const [dialogAberto, setDialogAberto] = useState(false);
  const [usuariosDetalhes, setUsuariosDetalhes] = useState<any[]>([]);

  const { data: usuarios = [], isLoading } = useUsuariosClinicas(clinicaAtual || undefined);
  const createUsuarioClinica = useCreateUsuarioClinica();
  const removeUsuarioClinica = useRemoveUsuarioClinica();

  // Buscar detalhes dos usuários
  useEffect(() => {
    const fetchUsuariosDetalhes = async () => {
      if (usuarios.length === 0) return;

      const detalhes = await Promise.all(
        usuarios.map(async (usuarioClinica) => {
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('email')
              .eq('id', usuarioClinica.usuario_id)
              .single();

            return {
              ...usuarioClinica,
              email: userData?.email || 'Email não encontrado'
            };
          } catch (error) {
            return {
              ...usuarioClinica,
              email: 'Erro ao carregar email'
            };
          }
        })
      );

      setUsuariosDetalhes(detalhes);
    };

    fetchUsuariosDetalhes();
  }, [usuarios]);

  const handleAdicionarUsuario = async () => {
    if (!clinicaAtual) {
      toast.error('Nenhuma clínica selecionada');
      return;
    }

    try {
      // Primeiro, tentar encontrar o usuário pelo email
      const { data: usersList, error: searchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', novoUsuario.email)
        .single();

      if (searchError || !usersList) {
        toast.error('Usuário não encontrado. O usuário deve estar cadastrado no sistema.');
        return;
      }

      await createUsuarioClinica.mutateAsync({
        usuario_id: usersList.id,
        clinica_id: clinicaAtual,
        tipo_papel: novoUsuario.tipo_papel,
      });

      setNovoUsuario({ email: '', tipo_papel: 'recepcionista' });
      setDialogAberto(false);
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
    }
  };

  const handleRemoverUsuario = async (usuarioClinicaId: string) => {
    await removeUsuarioClinica.mutateAsync(usuarioClinicaId);
  };

  const getTipoPapelDisplay = (tipo: string) => {
    switch (tipo) {
      case 'admin_clinica': return 'Admin da Clínica';
      case 'profissional': return 'Profissional';
      case 'recepcionista': return 'Recepcionista';
      default: return tipo;
    }
  };

  const getTipoPapelVariant = (tipo: string) => {
    switch (tipo) {
      case 'admin_clinica': return 'default';
      case 'profissional': return 'secondary';
      case 'recepcionista': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Equipe</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciar Equipe</CardTitle>
          <CardDescription>
            {isAdminClinica ? 'Gerencie os usuários da clínica' : 'Visualize a equipe da clínica'}
          </CardDescription>
        </div>
        
        {isAdminClinica && (
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Usuário à Clínica</DialogTitle>
                <DialogDescription>
                  Adicione um usuário existente à clínica. O usuário deve estar previamente cadastrado no sistema.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail do Usuário</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@email.com"
                    value={novoUsuario.email}
                    onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tipo_papel">Tipo de Acesso</Label>
                  <Select 
                    value={novoUsuario.tipo_papel} 
                    onValueChange={(value: any) => setNovoUsuario({ ...novoUsuario, tipo_papel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recepcionista">Recepcionista</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="admin_clinica">Admin da Clínica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={handleAdicionarUsuario}
                  disabled={createUsuarioClinica.isPending || !novoUsuario.email}
                >
                  {createUsuarioClinica.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {usuariosDetalhes.map((usuarioClinica) => (
            <div key={usuarioClinica.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div>
                    <h4 className="font-medium">{usuarioClinica.email}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={getTipoPapelVariant(usuarioClinica.tipo_papel)}>
                        {getTipoPapelDisplay(usuarioClinica.tipo_papel)}
                      </Badge>
                      {usuarioClinica.ativo && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Ativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {isAdminClinica && (
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={usuarioClinica.ativo} 
                    disabled={true}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRemoverUsuario(usuarioClinica.id)}
                    disabled={removeUsuarioClinica.isPending}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          {usuariosDetalhes.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado nesta clínica.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}