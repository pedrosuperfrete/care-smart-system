
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<'admin' | 'profissional' | 'recepcionista'>('profissional');
  const [loading, setLoading] = useState(false);
  const [criarNovaClinica, setCriarNovaClinica] = useState(false);
  const [dadosClinica, setDadosClinica] = useState({ nome: '', cnpj: '', endereco: '' });
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const novaClinica = criarNovaClinica && dadosClinica.nome && dadosClinica.cnpj ? dadosClinica : undefined;
        const { error } = await signUp(email, password, tipoUsuario, novaClinica);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Conta criada com sucesso! Redirecionando...');
          // Aguarda um momento para mostrar o toast e depois redireciona
          setTimeout(() => {
            navigate('/');
          }, 1500);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error);
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {isSignUp ? 'Criar Conta' : 'Fazer Login'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp 
              ? 'Preencha os dados para criar sua conta' 
              : 'Entre com suas credenciais'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Usuário</Label>
                  <Select value={tipoUsuario} onValueChange={(value) => setTipoUsuario(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="recepcionista">Recepcionista</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {tipoUsuario === 'profissional' && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="criarNovaClinica"
                        checked={criarNovaClinica}
                        onChange={(e) => setCriarNovaClinica(e.target.checked)}
                      />
                      <Label htmlFor="criarNovaClinica" className="text-sm">
                        Criar nova clínica (você será o administrador)
                      </Label>
                    </div>
                  </div>
                )}

                {criarNovaClinica && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nomeClinica">Nome da Clínica</Label>
                      <Input
                        id="nomeClinica"
                        type="text"
                        placeholder="Nome da sua clínica"
                        value={dadosClinica.nome}
                        onChange={(e) => setDadosClinica({ ...dadosClinica, nome: e.target.value })}
                        required={criarNovaClinica}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnpjClinica">CNPJ da Clínica</Label>
                      <Input
                        id="cnpjClinica"
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={dadosClinica.cnpj}
                        onChange={(e) => setDadosClinica({ ...dadosClinica, cnpj: e.target.value })}
                        required={criarNovaClinica}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enderecoClinica">Endereço (Opcional)</Label>
                      <Input
                        id="enderecoClinica"
                        type="text"
                        placeholder="Endereço da clínica"
                        value={dadosClinica.endereco}
                        onChange={(e) => setDadosClinica({ ...dadosClinica, endereco: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {isSignUp 
                  ? 'Já tem uma conta? Faça login' 
                  : 'Não tem uma conta? Cadastre-se'
                }
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
