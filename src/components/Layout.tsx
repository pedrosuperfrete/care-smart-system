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
        <main className="flex-1 p-6 overflow-auto bg-background">
          <AlertaAssinatura />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}