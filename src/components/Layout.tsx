
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ReactNode, useState } from "react";
import { Menu } from "lucide-react";
import { SubscriptionBanner } from "./SubscriptionBanner";
import { usePacientesLimit } from "@/hooks/usePlanos";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: limitData } = usePacientesLimit();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const showBanner = limitData?.isAtLimit && !bannerDismissed;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SidebarTrigger className="md:hidden">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <h1 className="text-xl font-semibold text-gray-900">Sistema de Gestão Clínica</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">JS</span>
              </div>
            </div>
          </header>
          <div className="flex-1 p-6 overflow-auto">
            {showBanner && (
              <SubscriptionBanner onDismiss={() => setBannerDismissed(true)} />
            )}
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
