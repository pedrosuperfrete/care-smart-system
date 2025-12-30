import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, Building, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<'admin' | 'profissional' | 'recepcionista'>('profissional');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirecionar se já estiver logado (exceto quando criando usuário pela equipe)
  useEffect(() => {
    const isCreatingTeamUser = sessionStorage.getItem('creating_team_user') === 'true';
    if (user && !isCreatingTeamUser) {
      navigate('/app/dashboard');
    }
  }, [user, navigate]);

  // Tratar erros do OAuth
  useEffect(() => {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      toast.error('Erro ao fazer login com Google: ' + (errorDescription || error));
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app/auth`,
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Erro ao iniciar login com Google:', error);
        toast.error('Erro ao conectar com Google: ' + error.message);
      }
    } catch (error: any) {
      console.error('Erro inesperado no login com Google:', error);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setGoogleLoading(false);
    }
  };

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
        // Validar nome
        if (!nome.trim()) {
          toast.error('O nome é obrigatório');
          return;
        }
        
        if (nome.trim().length < 3) {
          toast.error('O nome deve ter pelo menos 3 caracteres');
          return;
        }
        
        if (password !== confirmPassword) {
          toast.error('As senhas não coincidem');
          return;
        }
        
        // ⚠️ SECURITY: Strengthen password requirements
        if (password.length < 8) {
          toast.error('A senha deve ter pelo menos 8 caracteres');
          return;
        }
        
        if (!/[A-Z]/.test(password)) {
          toast.error('A senha deve conter pelo menos uma letra maiúscula');
          return;
        }
        
        if (!/[a-z]/.test(password)) {
          toast.error('A senha deve conter pelo menos uma letra minúscula');
          return;
        }
        
        if (!/[0-9]/.test(password)) {
          toast.error('A senha deve conter pelo menos um número');
          return;
        }
        
        if (!/[^A-Za-z0-9]/.test(password)) {
          toast.error('A senha deve conter pelo menos um caractere especial (!@#$%^&*)');
          return;
        }
        
        const { error } = await signUp(email, password, tipoUsuario, nome.trim());
        if (error) {
          toast.error(error);
        } else {
          toast.success('Conta criada com sucesso! Redirecionando...');
          setTimeout(() => {
            navigate('/app/dashboard');
          }, 1500);
        }
      } else {
        setPasswordError(''); // Limpar erro anterior
        const { error } = await signIn(email, password);
        if (error) {
          console.log('Erro de login:', error);
          const errorLower = error.toLowerCase();
          
          // Supabase retorna "Invalid login credentials" tanto para email não encontrado quanto senha errada
          // Por segurança, mostramos erro de senha e mantemos o email
          if (errorLower.includes('invalid') || error.includes('400') || errorLower.includes('credentials') || errorLower.includes('password')) {
            setPasswordError('Email ou senha incorretos. Verifique seus dados.');
          } 
          // Verificar se é erro específico de email não encontrado
          else if (errorLower.includes('user not found') || errorLower.includes('no user')) {
            toast.info('Email não cadastrado. Redirecionando para criar conta...');
            setMode('signup');
            setPassword('');
            setConfirmPassword('');
          }
          // Verificar se email não foi confirmado
          else if (errorLower.includes('email not confirmed')) {
            toast.warning('Confirme seu email antes de fazer login. Verifique sua caixa de entrada.');
          } else {
            toast.error(error);
          }
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
          description: 'Junte-se ao Donee e transforme sua prática médica'
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
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/app" className="inline-block">
            <img 
              src="/lovable-uploads/df33c00a-881c-4c3a-8f60-77fcd8835e1b.png" 
              alt="Donee" 
              className="h-10 w-auto mx-auto" 
            />
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
              {/* Nome (apenas no signup) */}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium text-foreground">
                    Nome Completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Seu nome completo"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="pl-10 h-12"
                      required
                      minLength={3}
                    />
                  </div>
                </div>
              )}

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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (mode === 'login') setPasswordError('');
                    }}
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
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? 'password-error' : undefined}
                      className={`pl-10 pr-10 h-12 ${passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                      required
                      {...(mode === 'signup' ? { minLength: 8 } : {})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>

                  {mode === 'login' && passwordError && (
                    <Alert id="password-error" variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between gap-3">
                          <span>{passwordError}</span>
                          <button
                            type="button"
                            className="text-sm font-medium text-primary hover:text-primary/80"
                            onClick={() => {
                              setMode('signup');
                              setPassword('');
                              setConfirmPassword('');
                              setPasswordError('');
                            }}
                          >
                            Criar conta
                          </button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
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
                      minLength={8}
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

              {/* Separador e botão Google */}
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

                  {/* Botão Login com Google - Em breve */}
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 text-base font-medium opacity-60 cursor-not-allowed"
                      disabled
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 grayscale" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        <span>Continuar com Google</span>
                      </div>
                    </Button>
                    <span className="absolute -top-2 right-2 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full border border-amber-300">
                      Em breve
                    </span>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Login com Google estará disponível em breve
                  </p>

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