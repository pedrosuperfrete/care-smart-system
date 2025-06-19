import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Tables } from '@/integrations/supabase/types';

type UserProfile = Tables<'users'>;
type Profissional = Tables<'profissionais'>;

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  profissional: Profissional | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, tipoUsuario?: 'admin' | 'profissional' | 'recepcionista') => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updateProfissional: (data: Partial<Profissional>) => Promise<void>;
  isAdmin: boolean;
  isProfissional: boolean;
  isRecepcionista: boolean;
  needsOnboarding: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profissional, setProfissional] = useState<Profissional | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = userProfile?.tipo_usuario === 'admin';
  const isProfissional = userProfile?.tipo_usuario === 'profissional';
  const isRecepcionista = userProfile?.tipo_usuario === 'recepcionista';

  const needsOnboarding = isProfissional && (!profissional || !profissional.onboarding_completo);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setUserProfile(profile);
        
        if (profile.tipo_usuario === 'profissional') {
          const { data: prof } = await supabase
            .from('profissionais')
            .select('*')
            .eq('user_id', userId)
            .single();
          setProfissional(prof);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setProfissional(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message };
  };

  const signUp = async (email: string, password: string, tipoUsuario = 'profissional' as const) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined
      }
    });

    if (error) return { error: error.message };

    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          senha_hash: '',
          tipo_usuario: tipoUsuario
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
      }

      if (tipoUsuario === 'profissional') {
        const { data: clinica } = await supabase
          .from('clinicas')
          .select('id')
          .limit(1)
          .single();

        if (clinica) {
          await supabase
            .from('profissionais')
            .insert({
              user_id: data.user.id,
              clinica_id: clinica.id,
              nome: '',
              especialidade: '',
              crm_cro: '',
              onboarding_completo: false
            });
        }
      }
    }

    return {};
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

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      profissional,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      updateProfissional,
      isAdmin,
      isProfissional,
      isRecepcionista,
      needsOnboarding,
      refreshUserProfile
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
