import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificacaoErros } from "./layout/NotificacaoErros";
import { AlertaAssinatura } from "./layout/AlertaAssinatura";
import { SeletorClinica } from "./configuracoes/SeletorClinica";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClinica } from "@/hooks/useClinica";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, clinicaAtual } = useAuth();
  const { data: clinicasData } = useClinica();

  if (!user) {
    return <Navigate to="/app/auth" replace />;
  }

  const clinicaAtualData = Array.isArray(clinicasData) ? 
    clinicasData.find(c => c.id === clinicaAtual) : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-4">
              <SidebarTrigger className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors">
                <Menu className="w-5 h-5 text-foreground" />
              </SidebarTrigger>
              <h1 className="text-xl font-semibold text-foreground">
                {clinicaAtualData?.nome || 'Care Smart System'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <SeletorClinica />
              <NotificacaoErros />
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground text-sm font-medium">PP</span>
              </div>
            </div>
          </header>
          <div className="flex-1 p-6 overflow-auto bg-background">
            <AlertaAssinatura />
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}