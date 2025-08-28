
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Pacientes from "./pages/Pacientes";
import Agenda from "./pages/Agenda";
import WhatsApp from "./pages/WhatsApp";
import Prontuarios from "./pages/Prontuarios";
import Financeiro from "./pages/Financeiro";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import ErrosSistema from "./pages/ErrosSistema";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, needsOnboarding } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing Page - Home pública */}
      <Route path="/app" element={<Index />} />
      
      {/* Rotas da Plataforma - /app/* */}
      <Route path="/app/auth" element={
        user ? <Navigate to="/app/dashboard" replace /> : <Auth />
      } />
      
      <Route path="/app/onboarding" element={
        !user ? <Navigate to="/app/auth" replace /> : 
        needsOnboarding ? <Onboarding /> : <Navigate to="/app/dashboard" replace />
      } />
      
      <Route path="/app/dashboard" element={
        !user ? <Navigate to="/app/auth" replace /> :
        needsOnboarding ? <Navigate to="/app/onboarding" replace /> :
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/app/pacientes" element={
        !user ? <Navigate to="/app/auth" replace /> :
        needsOnboarding ? <Navigate to="/app/onboarding" replace /> :
        <ProtectedRoute allowedRoles={['admin', 'profissional', 'recepcionista']}>
          <Layout><Pacientes /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/app/agenda" element={
        !user ? <Navigate to="/app/auth" replace /> :
        needsOnboarding ? <Navigate to="/app/onboarding" replace /> :
        <ProtectedRoute>
          <Layout><Agenda /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/app/whatsapp" element={
        !user ? <Navigate to="/app/auth" replace /> :
        needsOnboarding ? <Navigate to="/app/onboarding" replace /> :
        <ProtectedRoute>
          <Layout><WhatsApp /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/app/prontuarios" element={
        !user ? <Navigate to="/app/auth" replace /> :
        needsOnboarding ? <Navigate to="/app/onboarding" replace /> :
        <ProtectedRoute allowedRoles={['admin', 'profissional']}>
          <Layout><Prontuarios /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/app/financeiro" element={
        !user ? <Navigate to="/app/auth" replace /> :
        needsOnboarding ? <Navigate to="/app/onboarding" replace /> :
        <ProtectedRoute allowedRoles={['admin', 'profissional', 'recepcionista']}>
          <Layout><Financeiro /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/app/relatorios" element={
        !user ? <Navigate to="/app/auth" replace /> :
        needsOnboarding ? <Navigate to="/app/onboarding" replace /> :
        <ProtectedRoute>
          <Layout><Relatorios /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/app/configuracoes" element={
        !user ? <Navigate to="/app/auth" replace /> :
        needsOnboarding ? <Navigate to="/app/onboarding" replace /> :
        <ProtectedRoute>
          <Layout><Configuracoes /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/app/erros-sistema" element={
        !user ? <Navigate to="/app/auth" replace /> :
        needsOnboarding ? <Navigate to="/app/onboarding" replace /> :
        <ProtectedRoute allowedRoles={['admin', 'profissional']}>
          <Layout><ErrosSistema /></Layout>
        </ProtectedRoute>
      } />
      
      {/* Redirect root to /app */}
      <Route path="/" element={<Navigate to="/app" replace />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
