
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('admin' | 'profissional' | 'recepcionista')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userProfile, loading, needsOnboarding } = useAuth();

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

  if (needsOnboarding) {
    return <Navigate to="/app/onboarding" replace />;
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.tipo_usuario)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}
