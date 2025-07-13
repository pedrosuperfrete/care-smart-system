
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificacaoErros } from "./layout/NotificacaoErros";
import { ReactNode } from "react";
import { Menu } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
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
              <h1 className="text-xl font-semibold text-foreground">Sistema de Gestão Clínica</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificacaoErros />
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground text-sm font-medium">PP</span>
              </div>
            </div>
          </header>
          <div className="flex-1 p-6 overflow-auto bg-background">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
