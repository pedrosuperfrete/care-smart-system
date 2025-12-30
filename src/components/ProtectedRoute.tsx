
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('admin' | 'profissional' | 'recepcionista')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userProfile, loading, needsOnboarding, profissional } = useAuth();
  const location = useLocation();

  // Aguarda o carregamento inicial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/app/auth" replace />;
  }

  // Aguarda o carregamento do profissional se for tipo profissional
  if (userProfile?.tipo_usuario === 'profissional' && profissional === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se precisa onboarding, leva o usuário para o dashboard (onde o modal aparece)
  // Evita loop com /app/onboarding e mantém a UX "dashboard + modal".
  if (needsOnboarding && location.pathname !== '/app/dashboard') {
    return <Navigate to="/app/dashboard" replace />;
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.tipo_usuario)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}
