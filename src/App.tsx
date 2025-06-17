
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Pacientes from "./pages/Pacientes";
import Agenda from "./pages/Agenda";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/pacientes" element={<Layout><Pacientes /></Layout>} />
          <Route path="/agenda" element={<Layout><Agenda /></Layout>} />
          <Route path="/prontuarios" element={<Layout><div className="p-8 text-center"><h1 className="text-2xl font-bold">Prontuários</h1><p className="text-gray-600 mt-2">Módulo em desenvolvimento</p></div></Layout>} />
          <Route path="/financeiro" element={<Layout><div className="p-8 text-center"><h1 className="text-2xl font-bold">Financeiro</h1><p className="text-gray-600 mt-2">Módulo em desenvolvimento</p></div></Layout>} />
          <Route path="/relatorios" element={<Layout><div className="p-8 text-center"><h1 className="text-2xl font-bold">Relatórios</h1><p className="text-gray-600 mt-2">Módulo em desenvolvimento</p></div></Layout>} />
          <Route path="/configuracoes" element={<Layout><div className="p-8 text-center"><h1 className="text-2xl font-bold">Configurações</h1><p className="text-gray-600 mt-2">Módulo em desenvolvimento</p></div></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
