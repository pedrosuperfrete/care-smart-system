import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type UserProfile = Tables<'users'>;
type Profissional = Tables<'profissionais'>;

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  profissional: Profissional | null;
  loading: boolean;
  clinicaAtual: string | null;
  clinicasUsuario: Array<{ clinica_id: string; tipo_papel: string }>;
  setClinicaAtual: (clinicaId: string) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, tipoUsuario?: 'admin' | 'profissional' | 'recepcionista') => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateProfissional: (data: Partial<Profissional>) => Promise<void>;
  isAdmin: boolean;
  isProfissional: boolean;
  isRecepcionista: boolean;
  isAdminClinica: boolean;
  needsOnboarding: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [loading, setLoading] = useState(true);
  const [clinicaAtual, setClinicaAtual] = useState<string | null>(null);
  const [clinicasUsuario, setClinicasUsuario] = useState<Array<{ clinica_id: string; tipo_papel: string }>>([]);

  const fetchUserProfile = async (userId: string, retryCount = 0) => {
    try {
      // Buscar perfil do usuário - usar maybeSingle para evitar erro se não existir
      const { data: userProfileData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.error('Erro ao buscar perfil do usuário:', userError);
        return;
      }

      // Se usuário não existe na tabela users e é a primeira tentativa, aguardar um pouco e tentar novamente
      if (!userProfileData && retryCount < 3) {
        console.log(`Usuário não encontrado na tabela users (tentativa ${retryCount + 1}/3), aguardando...`);
        setTimeout(() => {
          fetchUserProfile(userId, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Aguarda progressivamente mais tempo
        return;
      }

      if (!userProfileData) {
        console.log('Usuário não encontrado na tabela users após todas as tentativas');
        return;
      }

      setUserProfile(userProfileData);

      // Buscar clínicas do usuário
      const { data: clinicasData, error: clinicasError } = await supabase.rpc('get_user_clinicas');
      if (!clinicasError && clinicasData) {
        console.log('Clínicas do usuário:', clinicasData);
        setClinicasUsuario(clinicasData);
        
        // Definir clínica atual se não estiver definida
        if (clinicasData.length > 0 && !clinicaAtual) {
          console.log('Definindo clínica atual:', clinicasData[0].clinica_id);
          setClinicaAtual(clinicasData[0].clinica_id);
        }
      }

      // Se for profissional, buscar dados adicionais
      if (userProfileData?.tipo_usuario === 'profissional') {
        const { data: profissionalData, error: profError } = await supabase
          .from('profissionais')
          .select('*')
          .eq('user_id', userId)
          .eq('ativo', true)
          .maybeSingle();

        if (!profError && profissionalData) {
          console.log('Profissional carregado:', profissionalData);
          setProfissional(profissionalData);
        } else if (!profError && !profissionalData && retryCount < 3) {
          // Se não encontrou profissional e é usuário profissional, tentar novamente
          console.log(`Profissional não encontrado (tentativa ${retryCount + 1}/3), aguardando...`);
          setTimeout(() => {
            fetchUserProfile(userId, retryCount + 1);
          }, 1000 * (retryCount + 1));
          return;
        } else if (!profError) {
          // Profissional não encontrado após todas as tentativas, limpar estado
          console.log('Profissional não encontrado após todas as tentativas');
          setProfissional(null);
        }
      } else {
        // Não é profissional, limpar estado
        setProfissional(null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      // Em caso de erro, tentar novamente se ainda há tentativas
      if (retryCount < 3) {
        setTimeout(() => {
          fetchUserProfile(userId, retryCount + 1);
        }, 1000 * (retryCount + 1));
      }
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setProfissional(null);
        setClinicasUsuario([]);
        setClinicaAtual(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      toast.success('Login realizado com sucesso!');
      return {};
    } catch (error: any) {
      console.error('Erro no login:', error);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    tipoUsuario: 'admin' | 'profissional' | 'recepcionista' = 'profissional'
  ) => {
    try {
      setLoading(true);
      
      // Registrar usuário no Supabase Auth primeiro
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.user) {
        return { error: 'Erro ao criar usuário' };
      }

      // Para profissionais, criar uma clínica temporária
      // Para outros tipos, associar à primeira clínica disponível
      let clinicaId: string | null = null;
      
      if (tipoUsuario === 'profissional') {
        // Criar clínica temporária para o profissional
        const { data: clinicaTemp, error: clinicaError } = await supabase
          .from('clinicas')
          .insert({
            nome: 'Clínica Temporária',
            cnpj: `temp-${data.user.id.substring(0, 8)}`,
            endereco: 'Aguardando definição no onboarding',
          })
          .select()
          .single();

        if (clinicaError) {
          console.error('Erro ao criar clínica temporária:', clinicaError);
          return { error: 'Erro ao criar clínica temporária: ' + clinicaError.message };
        }
        
        clinicaId = clinicaTemp.id;
      } else {
        // Para outros usuários, buscar primeira clínica disponível
        const { data: clinicas } = await supabase
          .from('clinicas')
          .select('id')
          .limit(1);
        
        if (clinicas && clinicas.length > 0) {
          clinicaId = clinicas[0].id;
        }
      }

      if (!clinicaId) {
        return { error: 'Erro: não foi possível definir clínica' };
      }

      // Criar perfil na tabela users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          senha_hash: '',  // Será gerenciado pelo Supabase Auth
          tipo_usuario: tipoUsuario,
        });

      if (userError) {
        console.error('Erro ao criar perfil do usuário:', userError);
        return { error: 'Erro ao criar perfil do usuário: ' + userError.message };
      }

      // Criar associação usuário-clínica (temporária para profissionais)
      const tipoPapel = tipoUsuario === 'admin' ? 'admin_clinica' : 
                        tipoUsuario === 'profissional' ? 'profissional' : 'recepcionista';

      const { error: associacaoError } = await supabase
        .from('usuarios_clinicas')
        .insert({
          usuario_id: data.user.id,
          clinica_id: clinicaId,
          tipo_papel: tipoPapel,
        });

      if (associacaoError) {
        console.error('Erro ao associar usuário à clínica:', associacaoError);
        return { error: 'Erro ao associar usuário à clínica: ' + associacaoError.message };
      }

      // Se for profissional, criar registro na tabela profissionais
      if (tipoUsuario === 'profissional') {
        const { error: profError } = await supabase
          .from('profissionais')
          .insert({
            user_id: data.user.id,
            clinica_id: clinicaId,
            nome: '',
            especialidade: '',
            crm_cro: '',
            onboarding_completo: false,
          });

        if (profError) {
          console.error('Erro ao criar perfil profissional:', profError);
          return { error: 'Erro ao criar perfil profissional: ' + profError.message };
        }
      }
      
      toast.success('Conta criada com sucesso!');
      return {};
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', user.id);

    if (error) throw error;
    await fetchUserProfile(user.id);
  };

  const updateProfissional = async (data: Partial<Profissional>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profissionais')
      .update(data)
      .eq('user_id', user.id);

    if (error) throw error;
    await fetchUserProfile(user.id);
  };

  const isAdmin = userProfile?.tipo_usuario === 'admin';
  const isProfissional = userProfile?.tipo_usuario === 'profissional';
  const isRecepcionista = userProfile?.tipo_usuario === 'recepcionista';
  const isAdminClinica = clinicasUsuario.some(c => c.tipo_papel === 'admin_clinica');
  const needsOnboarding = isProfissional && (!profissional || !profissional?.onboarding_completo);

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      profissional,
      loading,
      clinicaAtual,
      clinicasUsuario,
      setClinicaAtual,
      signIn,
      signUp,
      signOut,
      updateProfile,
      updateProfissional,
      isAdmin,
      isProfissional,
      isRecepcionista,
      isAdminClinica,
      needsOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}