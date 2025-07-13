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
  signUp: (email: string, password: string, tipoUsuario?: 'admin' | 'profissional' | 'recepcionista', novaClinica?: { nome: string; cnpj: string; endereco?: string }) => Promise<{ error?: string }>;
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

  const fetchUserProfile = async (userId: string) => {
    try {
      // Buscar perfil do usuário
      const { data: userProfileData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Erro ao buscar perfil do usuário:', userError);
        return;
      }

      setUserProfile(userProfileData);

      // Buscar clínicas do usuário
      const { data: clinicasData, error: clinicasError } = await supabase.rpc('get_user_clinicas');
      if (!clinicasError && clinicasData) {
        setClinicasUsuario(clinicasData);
        
        // Definir clínica atual se não estiver definida
        if (clinicasData.length > 0 && !clinicaAtual) {
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
          .single();

        if (!profError && profissionalData) {
          setProfissional(profissionalData);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
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
    tipoUsuario: 'admin' | 'profissional' | 'recepcionista' = 'profissional',
    novaClinica?: { nome: string; cnpj: string; endereco?: string }
  ) => {
    try {
      setLoading(true);
      
      let clinicaId: string | null = null;

      // Se deve criar nova clínica, criar primeiro
      if (novaClinica) {
        const { data: clinicaData, error: clinicaError } = await supabase
          .from('clinicas')
          .insert({
            nome: novaClinica.nome,
            cnpj: novaClinica.cnpj,
            endereco: novaClinica.endereco || null,
          })
          .select()
          .single();

        if (clinicaError) {
          return { error: 'Erro ao criar clínica: ' + clinicaError.message };
        }

        clinicaId = clinicaData.id;
      } else {
        // Usar primeira clínica existente
        const { data: clinicas } = await supabase
          .from('clinicas')
          .select('id')
          .limit(1);
        
        if (clinicas && clinicas.length > 0) {
          clinicaId = clinicas[0].id;
        }
      }

      // Registrar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user && clinicaId) {
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
          return { error: 'Erro ao criar perfil do usuário' };
        }

        // Criar associação usuário-clínica
        const tipoPapel = novaClinica ? 'admin_clinica' : 
                          tipoUsuario === 'admin' ? 'admin_clinica' : 
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
          }
        }
        
        toast.success('Conta criada com sucesso!');
        return {};
      }

      return { error: 'Erro desconhecido' };
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
  const needsOnboarding = isProfissional && !profissional?.onboarding_completo;

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