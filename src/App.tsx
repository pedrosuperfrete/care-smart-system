
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/pacientes" element={
              <ProtectedRoute allowedRoles={['admin', 'profissional', 'recepcionista']}>
                <Layout><Pacientes /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/agenda" element={
              <ProtectedRoute>
                <Layout><Agenda /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/prontuarios" element={
              <ProtectedRoute allowedRoles={['admin', 'profissional']}>
                <Layout><Prontuarios /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/financeiro" element={
              <ProtectedRoute allowedRoles={['admin', 'profissional']}>
                <Layout><Financeiro /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute>
                <Layout><Relatorios /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute>
                <Layout><Configuracoes /></Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
