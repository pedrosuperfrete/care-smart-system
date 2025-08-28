import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  BarChart3, 
  Clock, 
  MessageSquare, 
  FileText, 
  TrendingUp,
  Plus,
  Eye,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAgendamentosStats } from '@/hooks/useAgendamentos';
import { useFinanceiroStats } from '@/hooks/useFinanceiro';
import { usePacientes } from '@/hooks/usePacientes';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { userProfile } = useAuth();
  const { data: agendamentosStats, isLoading: loadingAgendamentos } = useAgendamentosStats();
  const { data: financeiroStats, isLoading: loadingFinanceiro } = useFinanceiroStats();
  const { data: pacientes, isLoading: loadingPacientes } = usePacientes();

  const nomeUsuario = userProfile?.nome || 'Profissional';
  const totalPacientes = pacientes?.length || 0;

  const quickActions = [
    {
      title: 'Novo Agendamento',
      description: 'Agendar uma nova consulta',
      icon: Calendar,
      href: '/app/agenda',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      title: 'Novo Paciente',
      description: 'Cadastrar novo paciente',
      icon: Users,
      href: '/app/pacientes',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      title: 'Novo Pagamento',
      description: 'Registrar pagamento',
      icon: DollarSign,
      href: '/app/financeiro',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      title: 'Novo Prontuário',
      description: 'Criar prontuário médico',
      icon: FileText,
      href: '/app/prontuarios',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    }
  ];

  const statsCards = [
    {
      title: 'Consultas Hoje',
      value: agendamentosStats?.consultasHoje || 0,
      description: 'agendamentos para hoje',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      loading: loadingAgendamentos
    },
    {
      title: 'Confirmadas Hoje',
      value: agendamentosStats?.confirmadasHoje || 0,
      description: 'consultas confirmadas',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      loading: loadingAgendamentos
    },
    {
      title: 'Total de Pacientes',
      value: totalPacientes,
      description: 'pacientes cadastrados',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      loading: loadingPacientes
    },
    {
      title: 'Receita do Mês',
      value: financeiroStats?.totalRecebido ? `R$ ${financeiroStats.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
      description: 'faturamento mensal',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      loading: loadingFinanceiro
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Bem-vindo de volta, {nomeUsuario}! 👋
        </h1>
        <p className="text-lg text-muted-foreground">
          Aqui está o resumo da sua clínica hoje
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                  <IconComponent className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {stat.loading ? (
                  <Skeleton className="h-8 w-20 mb-2" />
                ) : (
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Link key={index} to={action.href}>
                  <Button 
                    variant="outline" 
                    className={`w-full h-auto p-4 ${action.hoverColor} hover:text-white transition-colors group`}
                  >
                    <div className="flex flex-col items-center space-y-2 text-center">
                      <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center text-white group-hover:bg-white/20`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium">{action.title}</p>
                        <p className="text-xs text-muted-foreground group-hover:text-white/80">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agenda Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Agenda de Hoje</CardTitle>
              <CardDescription>
                Próximos agendamentos
              </CardDescription>
            </div>
            <Link to="/app/agenda">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Ver Agenda
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingAgendamentos ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : agendamentosStats?.consultasHoje > 0 ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    {agendamentosStats.consultasHoje} consultas agendadas para hoje
                  </p>
                </div>
                <Link to="/app/agenda">
                  <Button className="w-full">
                    Ver detalhes da agenda
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground mb-4">
                  Nenhuma consulta agendada para hoje
                </p>
                <Link to="/app/agenda">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Agendar Consulta
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Resumo Financeiro</CardTitle>
              <CardDescription>
                Status dos pagamentos
              </CardDescription>
            </div>
            <Link to="/app/financeiro">
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Ver Financeiro
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingFinanceiro ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div>
                    <p className="text-sm font-medium text-green-800">A Receber</p>
                    <p className="text-lg font-bold text-green-900">
                      R$ {(financeiroStats?.totalPendente || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div>
                    <p className="text-sm font-medium text-red-800">Em Atraso</p>
                    <p className="text-lg font-bold text-red-900">
                      R$ {(financeiroStats?.totalVencido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>

                <Link to="/app/financeiro">
                  <Button className="w-full mt-4">
                    Ver relatório completo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Features Showcase */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-center">🚀 Explore Todos os Recursos da Plataforma</CardTitle>
          <CardDescription className="text-center">
            Maximize sua produtividade com nossas ferramentas completas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold mb-1">WhatsApp Integrado</h4>
              <p className="text-sm text-muted-foreground">
                Automatize lembretes e confirmações
              </p>
            </div>
            <div className="text-center p-4">
              <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Prontuários Digitais</h4>
              <p className="text-sm text-muted-foreground">
                Histórico médico completo e seguro
              </p>
            </div>
            <div className="text-center p-4">
              <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Relatórios Inteligentes</h4>
              <p className="text-sm text-muted-foreground">
                Insights para crescer seu negócio
              </p>
            </div>
          </div>
          <div className="text-center mt-6">
            <Link to="/app/relatorios">
              <Button>
                Ver Relatórios Completos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}