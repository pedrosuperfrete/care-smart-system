
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Pacientes from "./pages/Pacientes";
import Agenda from "./pages/Agenda";
import Prontuarios from "./pages/Prontuarios";
import Financeiro from "./pages/Financeiro";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
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
      <Route path="/auth" element={
        user ? <Navigate to="/" replace /> : <Auth />
      } />
      
      <Route path="/onboarding" element={
        !user ? <Navigate to="/auth" replace /> : 
        needsOnboarding ? <Onboarding /> : <Navigate to="/" replace />
      } />
      
      <Route path="/" element={
        !user ? <Navigate to="/auth" replace /> :
        needsOnboarding ? <Navigate to="/onboarding" replace /> :
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/pacientes" element={
        !user ? <Navigate to="/auth" replace /> :
        needsOnboarding ? <Navigate to="/onboarding" replace /> :
        <ProtectedRoute allowedRoles={['admin', 'profissional', 'recepcionista']}>
          <Layout><Pacientes /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/agenda" element={
        !user ? <Navigate to="/auth" replace /> :
        needsOnboarding ? <Navigate to="/onboarding" replace /> :
        <ProtectedRoute>
          <Layout><Agenda /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/prontuarios" element={
        !user ? <Navigate to="/auth" replace /> :
        needsOnboarding ? <Navigate to="/onboarding" replace /> :
        <ProtectedRoute allowedRoles={['admin', 'profissional']}>
          <Layout><Prontuarios /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/financeiro" element={
        !user ? <Navigate to="/auth" replace /> :
        needsOnboarding ? <Navigate to="/onboarding" replace /> :
        <ProtectedRoute allowedRoles={['admin', 'profissional']}>
          <Layout><Financeiro /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/relatorios" element={
        !user ? <Navigate to="/auth" replace /> :
        needsOnboarding ? <Navigate to="/onboarding" replace /> :
        <ProtectedRoute>
          <Layout><Relatorios /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuracoes" element={
        !user ? <Navigate to="/auth" replace /> :
        needsOnboarding ? <Navigate to="/onboarding" replace /> :
        <ProtectedRoute>
          <Layout><Configuracoes /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
