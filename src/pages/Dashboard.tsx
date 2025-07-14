
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { usePacientesStats } from '@/hooks/usePacientes';
import { useAgendamentosStats, useProximosAgendamentos } from '@/hooks/useAgendamentos';
import { useFinanceiroStats } from '@/hooks/useFinanceiro';
import { useAtividadesRecentes } from '@/hooks/useAtividades';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, FileText, DollarSign, Plus, BarChart3, Clock } from 'lucide-react';

export default function Dashboard() {
  const { userProfile, isAdmin, isProfissional } = useAuth();
  const { data: pacientesStats } = usePacientesStats();
  const { data: agendamentosStats } = useAgendamentosStats();
  const { data: financeiroStats } = useFinanceiroStats();
  const { data: proximosAgendamentos = [] } = useProximosAgendamentos();
  const { data: atividadesRecentes = [] } = useAtividadesRecentes();
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Total de Pacientes',
      value: pacientesStats?.total || 0,
      icon: Users,
      description: 'Pacientes cadastrados',
    },
    {
      title: 'Consultas Hoje',
      value: `${agendamentosStats?.consultasHoje || 0} (${agendamentosStats?.confirmadasHoje || 0} confirmadas)`,
      icon: Calendar,
      description: 'Agendamentos para hoje',
    },
    {
      title: 'Consultas Pendentes',
      value: agendamentosStats?.pendentes || 0,
      icon: FileText,
      description: 'Aguardando confirmação',
    },
    {
      title: 'Receita do Mês',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(financeiroStats?.receitaMensal || 0),
      icon: DollarSign,
      description: 'Faturamento atual',
      hidden: !isAdmin && !isProfissional,
    },
  ];

  const quickActions = [
    {
      title: 'Nova Consulta',
      description: 'Agendar nova consulta',
      icon: Plus,
      onClick: () => navigate('/app/agenda'),
      color: 'bg-primary hover:bg-primary/90',
    },
    {
      title: 'Novo Paciente',
      description: 'Cadastrar paciente',
      icon: Users,
      onClick: () => navigate('/app/pacientes'),
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Relatórios',
      description: 'Ver relatórios',
      icon: BarChart3,
      onClick: () => navigate('/app/relatorios'),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Bem-vindo, {userProfile?.email?.split('@')[0]}!
        </h1>
        <p className="text-gray-600 mt-1">
          Aqui está um resumo da sua clínica hoje.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) =>
          !stat.hidden ? (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ) : null
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente as principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                className={`h-24 flex flex-col items-center justify-center space-y-2 ${action.color}`}
              >
                <action.icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-xs opacity-90">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Próximas Consultas</CardTitle>
            <CardDescription>
              Consultas agendadas para os próximos dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {proximosAgendamentos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhuma consulta agendada
              </p>
            ) : (
              <div className="space-y-3">
                {proximosAgendamentos.map((agendamento) => (
                  <div key={agendamento.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-lg">
                        {agendamento.confirmado_pelo_paciente ? '✅' : '⏳'}
                      </div>
                      <div>
                        <div className="font-medium">
                          {(agendamento as any).pacientes?.nome}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(agendamento.data_inicio).toLocaleString('pt-BR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {agendamento.tipo_servico}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/app/pacientes`)}
                      >
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas atividades do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {atividadesRecentes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhuma atividade recente
              </p>
            ) : (
              <div className="space-y-3">
                {atividadesRecentes.map((atividade) => (
                  <div key={atividade.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="text-lg">{atividade.icone}</div>
                    <div className="flex-1">
                      <div className="text-sm">{atividade.descricao}</div>
                      <div className="text-xs text-gray-500">{atividade.data}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
