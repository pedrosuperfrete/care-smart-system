import { Calendar, Users, FileText, DollarSign, Home, Settings, User, Clock, CreditCard, LogOut, ChevronDown, AlertTriangle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function AppSidebar() {
  const location = useLocation();
  const { userProfile, profissional, isAdmin, isProfissional, isRecepcionista, signOut } = useAuth();

  const baseMenuItems = [
    {
      title: "Início",
      url: "/app/home",
      icon: Home,
    },
    {
      title: "Pacientes",
      url: "/app/pacientes",
      icon: Users,
    },
    {
      title: "Agenda",
      url: "/app/agenda",
      icon: Calendar,
    },
    {
      title: "Prontuários",
      url: "/app/prontuarios",
      icon: FileText,
      hideFor: ['recepcionista'],
    },
    {
      title: "Financeiro",
      url: "/app/financeiro",
      icon: DollarSign,
    },
    {
      title: "Relatórios",
      url: "/app/relatorios",
      icon: Clock,
    },
    {
      title: "Erros do Sistema",
      url: "/app/erros-sistema",
      icon: AlertTriangle,
      hideFor: ['recepcionista'],
    },
    {
      title: "Configurações",
      url: "/app/configuracoes",
      icon: Settings,
    },
  ];

  const menuItems = baseMenuItems.filter(item => {
    if (!item.hideFor) return true;
    return !item.hideFor.includes(userProfile?.tipo_usuario || '');
  });

  const getUserDisplayInfo = () => {
    // Se for recepcionista, sempre mostrar informações do recepcionista, não do profissional
    if (userProfile?.tipo_usuario === 'recepcionista') {
      return {
        name: userProfile?.email?.split('@')[0] || 'Recepcionista',
        role: 'Recepcionista',
        initials: (userProfile?.email?.split('@')[0] || 'R').substring(0, 2).toUpperCase()
      };
    }
    
    // Para profissionais, mostrar dados do profissional se disponível
    if (userProfile?.tipo_usuario === 'profissional' && profissional?.nome) {
      return {
        name: profissional.nome,
        role: profissional.especialidade || 'Profissional',
        initials: profissional.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      };
    }
    
    // Fallback para outros tipos de usuário
    return {
      name: userProfile?.email?.split('@')[0] || 'Usuário',
      role: userProfile?.tipo_usuario === 'admin' ? 'Administrador' : 'Usuário',
      initials: (userProfile?.email?.split('@')[0] || 'U').substring(0, 2).toUpperCase()
    };
  };

  const userInfo = getUserDisplayInfo();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-6 border-b border-border hidden lg:block">
        <div className="flex items-center justify-center">
          <img 
            src="/lovable-uploads/df33c00a-881c-4c3a-8f60-77fcd8835e1b.png" 
            alt="Donee" 
            className="w-full h-full max-w-32"
          />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.url
                        ? "bg-primary text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Link to={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">{userInfo.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{userInfo.name}</p>
                <p className="text-xs text-gray-500 truncate">{userInfo.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
