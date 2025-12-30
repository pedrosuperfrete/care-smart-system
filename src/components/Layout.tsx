import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificacaoErros } from "./layout/NotificacaoErros";
import { AlertaAssinatura } from "./layout/AlertaAssinatura";
import { BannerOnboardingPendente } from "./layout/BannerOnboardingPendente";
import { SeletorClinica } from "./configuracoes/SeletorClinica";
import { OnboardingModal } from "./modals/OnboardingModal";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClinica } from "@/hooks/useClinica";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, clinicaAtual } = useAuth();
  const { data: clinicasData } = useClinica();
  const isMobile = useIsMobile();

  if (!user) {
    return <Navigate to="/app/auth" replace />;
  }

  const clinicaAtualData = Array.isArray(clinicasData) ? 
    clinicasData.find(c => c.id === clinicaAtual) : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          {isMobile && (
            <header className="flex items-center justify-between p-4 border-b bg-background lg:hidden">
              <SidebarTrigger className="p-2 hover:bg-muted rounded-md">
                <Menu className="h-6 w-6" />
              </SidebarTrigger>
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/df33c00a-881c-4c3a-8f60-77fcd8835e1b.png" 
                  alt="Donee" 
                  className="h-8 w-auto"
                />
              </div>
            </header>
          )}
          
          <BannerOnboardingPendente />
          <main className="flex-1 p-4 lg:p-6 overflow-auto bg-background">
            <AlertaAssinatura />
            {children}
          </main>
        </div>
        
        {/* Onboarding Modal - aparece sobre o dashboard */}
        <OnboardingModal />
      </div>
    </SidebarProvider>
  );
}