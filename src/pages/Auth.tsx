import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, Building, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<'admin' | 'profissional' | 'recepcionista'>('profissional');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/app/auth?mode=reset`
        });
        
        if (error) {
          toast.error('Erro ao enviar email de recuperação: ' + error.message);
        } else {
          setResetEmailSent(true);
          toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
        }
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          toast.error('As senhas não coincidem');
          return;
        }
        
        if (password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          return;
        }
        
        const { error } = await signUp(email, password, tipoUsuario);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Conta criada com sucesso! Redirecionando...');
          setTimeout(() => {
            navigate('/app/dashboard');
          }, 1500);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error);
        } else {
          navigate('/app/dashboard');
        }
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getTitleAndDescription = () => {
    switch (mode) {
      case 'signup':
        return {
          title: 'Criar sua conta',
          description: 'Junte-se ao HealthClinic e transforme sua prática médica'
        };
      case 'forgot':
        return {
          title: 'Recuperar senha',
          description: 'Digite seu email para receber as instruções de recuperação'
        };
      default:
        return {
          title: 'Bem-vindo de volta',
          description: 'Entre em sua conta para continuar'
        };
    }
  };

  const { title, description } = getTitleAndDescription();

  if (resetEmailSent && mode === 'forgot') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-success" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Email enviado!
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-2">
                  Verifique sua caixa de entrada e clique no link para redefinir sua senha
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Se você não receber o email em alguns minutos, verifique sua pasta de spam ou lixo eletrônico.
                </AlertDescription>
              </Alert>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setMode('login');
                  setResetEmailSent(false);
                  setEmail('');
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4">
      <div className="w-full max-w-md">
        {/* Logo e Link para Home */}
        <div className="text-center mb-8">
          <Link to="/app" className="inline-flex items-center space-x-3 group">
            <img 
              src="/lovable-uploads/df33c00a-881c-4c3a-8f60-77fcd8835e1b.png" 
              alt="HealthClinic" 
              className="h-10 w-auto" 
            />
            <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
              HealthClinic
            </span>
          </Link>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center space-y-2 pb-8">
            <CardTitle className="text-2xl font-bold text-foreground">
              {title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {/* Password (não mostrar no modo forgot) */}
              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password (apenas no signup) */}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 h-12"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>
              )}

              {/* Tipo de Usuário (apenas no signup) */}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="text-sm font-medium text-foreground">
                    Tipo de Usuário
                  </Label>
                  <Select value={tipoUsuario} onValueChange={(value) => setTipoUsuario(value as any)}>
                    <SelectTrigger className="h-12">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Selecione o tipo" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profissional">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Profissional de Saúde
                        </div>
                      </SelectItem>
                      <SelectItem value="recepcionista">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          Recepcionista
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Administrador
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Esqueci minha senha (apenas no login) */}
              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Carregando...</span>
                  </div>
                ) : (
                  mode === 'forgot' ? 'Enviar instruções' :
                  mode === 'signup' ? 'Criar conta' : 'Entrar'
                )}
              </Button>

              {/* Separador e link para mudar de modo */}
              {mode !== 'forgot' && (
                <>
                  <div className="relative">
                    <Separator />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-background px-2 text-xs text-muted-foreground">
                        OU
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {mode === 'login' 
                        ? 'Não tem uma conta? ' 
                        : 'Já tem uma conta? '
                      }
                      <span className="text-primary font-medium hover:text-primary/80">
                        {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
                      </span>
                    </button>
                  </div>
                </>
              )}

              {/* Voltar ao login (modo forgot) */}
              {mode === 'forgot' && (
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full"
                  onClick={() => setMode('login')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground">
          <p>
            Ao {mode === 'signup' ? 'criar uma conta' : 'fazer login'}, você concorda com nossos{' '}
            <Link to="#" className="text-primary hover:text-primary/80">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link to="#" className="text-primary hover:text-primary/80">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}