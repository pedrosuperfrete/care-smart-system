import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, UserMinus, Edit, Trash } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUsuariosClinicas, useCreateUsuarioClinica, useRemoveUsuarioClinica, useUpdateUsuarioClinica } from '@/hooks/useUsuariosClinicas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NovoUsuarioForm {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  tipo_papel: 'admin_clinica' | 'profissional' | 'recepcionista';
}

interface EditarUsuarioForm {
  id: string;
  email: string;
  tipo_papel: 'admin_clinica' | 'profissional' | 'recepcionista';
}

export function GerenciarEquipe() {
  const { isAdminClinica, isProfissional, isRecepcionista, clinicaAtual, user } = useAuth();
  const queryClient = useQueryClient();
  const [novoUsuario, setNovoUsuario] = useState<NovoUsuarioForm>({ 
    nome: '',
    email: '', 
    senha: '', 
    confirmarSenha: '', 
    tipo_papel: 'recepcionista' 
  });
  const [editandoUsuario, setEditandoUsuario] = useState<EditarUsuarioForm | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogEdicaoAberto, setDialogEdicaoAberto] = useState(false);
  const [usuariosDetalhes, setUsuariosDetalhes] = useState<any[]>([]);

  const { data: usuarios = [], isLoading } = useUsuariosClinicas(clinicaAtual || undefined);
  const createUsuarioClinica = useCreateUsuarioClinica();
  const removeUsuarioClinica = useRemoveUsuarioClinica();
  const updateUsuarioClinica = useUpdateUsuarioClinica();

  // Atualizar usuariosDetalhes diretamente dos dados já incluídos
  useEffect(() => {
    const detalhes = usuarios.map((usuarioClinica: any) => ({
      ...usuarioClinica,
      nome: usuarioClinica.users?.nome || 'Nome não informado',
      email: usuarioClinica.users?.email || 'Email não encontrado',
      tipo_usuario: usuarioClinica.users?.tipo_usuario
    }));
    setUsuariosDetalhes(detalhes);
  }, [usuarios]);


  const handleAdicionarUsuario = async () => {
    // Buscar a clínica real do profissional atual (não a temporária)
    const { data: profissionalData } = await supabase
      .from('profissionais')
      .select('clinica_id')
      .eq('user_id', user?.id)
      .eq('ativo', true)
      .single();

    const clinicaRealId = profissionalData?.clinica_id || clinicaAtual;

    if (!clinicaRealId) {
      toast.error('Nenhuma clínica selecionada');
      return;
    }

    // Validações
    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.senha || !novoUsuario.confirmarSenha) {
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
      // Primeiro, verificar se o usuário já existe na nossa tabela
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', novoUsuario.email)
        .maybeSingle();

      if (existingUser) {
        // Se já existe, verificar se já está associado à clínica real
        const { data: existingAssociation } = await supabase
          .from('usuarios_clinicas')
          .select('id')
          .eq('usuario_id', existingUser.id)
          .eq('clinica_id', clinicaRealId)
          .maybeSingle();

        if (existingAssociation) {
          toast.error('Usuário já está associado a esta clínica');
          return;
        }

        // Se não está associado, usar função security definer para associar à clínica
        const { data: novaAssociacao, error: associacaoError } = await supabase.rpc('create_usuario_clinica_by_admin', {
          p_usuario_id: existingUser.id,
          p_clinica_id: clinicaRealId,
          p_tipo_papel: novoUsuario.tipo_papel
        });

        if (associacaoError) {
          toast.error('Erro ao associar usuário à clínica: ' + associacaoError.message);
          return;
        }

        setNovoUsuario({ 
          nome: '',
          email: '', 
          senha: '', 
          confirmarSenha: '', 
          tipo_papel: 'recepcionista' 
        });
        setDialogAberto(false);
        
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['usuarios_clinicas'] });
        
        toast.success('Usuário adicionado à clínica com sucesso!');
        return;
      }

      // Salvar a sessão atual antes de criar o novo usuário
      const { data: currentSession } = await supabase.auth.getSession();
      
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

      // Fazer logout do usuário recém-criado e restaurar a sessão anterior
      await supabase.auth.signOut();
      if (currentSession.session) {
        await supabase.auth.setSession(currentSession.session);
      }

      // Criar registro na tabela users usando função security definer
      const { data: userId, error: userError } = await supabase.rpc('create_user_by_admin', {
        p_user_id: authData.user.id,
        p_email: novoUsuario.email,
        p_tipo_usuario: novoUsuario.tipo_papel === 'admin_clinica' ? 'admin' : novoUsuario.tipo_papel,
        p_nome: novoUsuario.nome
      });

      if (userError) {
        console.error('Erro ao criar registro do usuário:', userError);
        toast.error('Erro ao criar registro do usuário: ' + userError.message);
        return;
      }

      // Associar usuário à clínica real usando função security definer
      const { data: novaAssociacao, error: associacaoError } = await supabase.rpc('create_usuario_clinica_by_admin', {
        p_usuario_id: authData.user.id,
        p_clinica_id: clinicaRealId,
        p_tipo_papel: novoUsuario.tipo_papel
      });

      if (associacaoError) {
        toast.error('Erro ao associar usuário à clínica: ' + associacaoError.message);
        return;
      }

      // Se for profissional, criar registro na tabela profissionais
      if (novoUsuario.tipo_papel === 'profissional') {
        const { error: profError } = await supabase
          .from('profissionais')
          .insert({
            user_id: authData.user.id,
            clinica_id: clinicaRealId,
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
        nome: '',
        email: '', 
        senha: '', 
        confirmarSenha: '', 
        tipo_papel: 'recepcionista' 
      });
      setDialogAberto(false);
      
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['usuarios_clinicas'] });
      
      toast.success('Usuário criado e adicionado à clínica com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      toast.error('Erro inesperado ao criar usuário');
    }
  };

  const handleEditarUsuario = async () => {
    if (!editandoUsuario || !clinicaAtual) return;

    try {
      // Atualizar tipo de papel na associação clínica
      await updateUsuarioClinica.mutateAsync({
        id: editandoUsuario.id,
        tipo_papel: editandoUsuario.tipo_papel
      });

      // Buscar o usuario_id pela associação
      const usuario = usuariosDetalhes.find(u => u.id === editandoUsuario.id);
      if (usuario) {
        // Atualizar email na tabela users usando função security definer
        const { error: emailError } = await supabase.rpc('update_user_by_admin', {
          p_user_id: usuario.usuario_id,
          p_email: editandoUsuario.email,
          p_tipo_usuario: editandoUsuario.tipo_papel === 'admin_clinica' ? 'admin' : editandoUsuario.tipo_papel
        });

        if (emailError) {
          toast.error('Erro ao atualizar usuário: ' + emailError.message);
          return;
        }
      }

      setDialogEdicaoAberto(false);
      setEditandoUsuario(null);
      
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['usuarios_clinicas'] });
      
      toast.success('Usuário atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao editar usuário:', error);
      toast.error('Erro ao editar usuário');
    }
  };

  const handleExcluirUsuario = async (usuarioClinica: any) => {
    if (!confirm('Tem certeza que deseja excluir este usuário permanentemente? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      // Primeiro remover da clínica
      await removeUsuarioClinica.mutateAsync(usuarioClinica.id);

      // Depois excluir da tabela users (se necessário)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', usuarioClinica.usuario_id);

      if (deleteError) {
        console.error('Erro ao excluir usuário:', deleteError);
      }

      toast.success('Usuário excluído permanentemente!');
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const iniciarEdicao = (usuarioClinica: any) => {
    setEditandoUsuario({
      id: usuarioClinica.id,
      email: usuarioClinica.email,
      tipo_papel: usuarioClinica.tipo_papel
    });
    setDialogEdicaoAberto(true);
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
            {(isAdminClinica || isProfissional) ? 'Gerencie os usuários da clínica' : 'Visualize a equipe da clínica'}
          </CardDescription>
        </div>
        
        {(isAdminClinica || isProfissional) && (
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
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Nome completo do usuário"
                    value={novoUsuario.nome}
                    onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                  />
                </div>
                
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
                    !novoUsuario.nome || 
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
      
      {/* Dialog de Edição */}
      <Dialog open={dialogEdicaoAberto} onOpenChange={setDialogEdicaoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere as informações do usuário conforme necessário.
            </DialogDescription>
          </DialogHeader>
          
          {editandoUsuario && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-email">E-mail do Usuário</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="usuario@email.com"
                  value={editandoUsuario.email}
                  onChange={(e) => setEditandoUsuario({ ...editandoUsuario, email: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-tipo-papel">Tipo de Acesso</Label>
                <Select 
                  value={editandoUsuario.tipo_papel} 
                  onValueChange={(value: any) => setEditandoUsuario({ ...editandoUsuario, tipo_papel: value })}
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
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEdicaoAberto(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEditarUsuario}
              disabled={updateUsuarioClinica.isPending}
            >
              {updateUsuarioClinica.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <CardContent>
        <div className="space-y-4">
          {usuariosDetalhes.map((usuarioClinica) => (
            <div key={usuarioClinica.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div>
                    <h4 className="font-medium">{usuarioClinica.nome}</h4>
                    <p className="text-sm text-gray-600">{usuarioClinica.email}</p>
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
              
              {(isAdminClinica || isProfissional) && !isRecepcionista && (
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={usuarioClinica.ativo} 
                    onCheckedChange={(checked) => {
                      updateUsuarioClinica.mutate({
                        id: usuarioClinica.id,
                        ativo: checked
                      });
                    }}
                    disabled={updateUsuarioClinica.isPending}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => iniciarEdicao(usuarioClinica)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir permanentemente o usuário <strong>{usuarioClinica.email}</strong>? 
                          Esta ação não pode ser desfeita e o usuário será removido completamente do sistema.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleExcluirUsuario(usuarioClinica)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Excluir Permanentemente
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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