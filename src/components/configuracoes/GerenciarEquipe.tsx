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
  senha: string;
  confirmarSenha: string;
  tipo_papel: 'admin_clinica' | 'profissional' | 'recepcionista';
}

export function GerenciarEquipe() {
  const { isAdminClinica, clinicaAtual } = useAuth();
  const [novoUsuario, setNovoUsuario] = useState<NovoUsuarioForm>({ 
    email: '', 
    senha: '', 
    confirmarSenha: '', 
    tipo_papel: 'recepcionista' 
  });
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

    // Validações
    if (!novoUsuario.email || !novoUsuario.senha || !novoUsuario.confirmarSenha) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    if (novoUsuario.senha !== novoUsuario.confirmarSenha) {
      toast.error('As senhas não conferem');
      return;
    }

    if (novoUsuario.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      // Primeiro, verificar se o usuário já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', novoUsuario.email)
        .maybeSingle();

      if (existingUser) {
        // Se já existe, apenas associar à clínica
        await createUsuarioClinica.mutateAsync({
          usuario_id: existingUser.id,
          clinica_id: clinicaAtual,
          tipo_papel: novoUsuario.tipo_papel,
        });

        setNovoUsuario({ 
          email: '', 
          senha: '', 
          confirmarSenha: '', 
          tipo_papel: 'recepcionista' 
        });
        setDialogAberto(false);
        toast.success('Usuário adicionado à clínica com sucesso!');
        return;
      }

      // Criar novo usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: novoUsuario.email,
        password: novoUsuario.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        console.error('Erro de autenticação:', authError);
        if (authError.message.includes('User already registered')) {
          toast.error('E-mail já cadastrado no sistema. Use uma opção diferente.');
        } else {
          toast.error('Erro ao criar usuário: ' + authError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error('Erro ao criar usuário');
        return;
      }

      // Criar registro na tabela users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: novoUsuario.email,
          tipo_usuario: novoUsuario.tipo_papel === 'admin_clinica' ? 'admin' : novoUsuario.tipo_papel,
          senha_hash: 'managed_by_auth'
        });

      if (userError) {
        console.error('Erro ao criar registro do usuário:', userError);
        toast.error('Erro ao criar registro do usuário: ' + userError.message);
        return;
      }

      // Associar usuário à clínica
      await createUsuarioClinica.mutateAsync({
        usuario_id: authData.user.id,
        clinica_id: clinicaAtual,
        tipo_papel: novoUsuario.tipo_papel,
      });

      // Se for profissional, criar registro na tabela profissionais
      if (novoUsuario.tipo_papel === 'profissional') {
        const { error: profError } = await supabase
          .from('profissionais')
          .insert({
            user_id: authData.user.id,
            clinica_id: clinicaAtual,
            nome: '', // Será preenchido no onboarding
            especialidade: '',
            crm_cro: '',
            onboarding_completo: false
          });

        if (profError) {
          console.error('Erro ao criar registro do profissional:', profError);
        }
      }

      setNovoUsuario({ 
        email: '', 
        senha: '', 
        confirmarSenha: '', 
        tipo_papel: 'recepcionista' 
      });
      setDialogAberto(false);
      toast.success('Usuário criado e adicionado à clínica com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      toast.error('Erro inesperado ao criar usuário');
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
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Crie um novo usuário e adicione-o à clínica. Defina a senha inicial que será usada para o primeiro acesso.
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
                  <Label htmlFor="senha">Senha Inicial</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={novoUsuario.senha}
                    onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={novoUsuario.confirmarSenha}
                    onChange={(e) => setNovoUsuario({ ...novoUsuario, confirmarSenha: e.target.value })}
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
                  disabled={
                    createUsuarioClinica.isPending || 
                    !novoUsuario.email || 
                    !novoUsuario.senha || 
                    !novoUsuario.confirmarSenha
                  }
                >
                  {createUsuarioClinica.isPending ? 'Criando...' : 'Criar Usuário'}
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