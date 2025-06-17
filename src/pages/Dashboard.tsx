
import { Calendar, Users, DollarSign, FileText, TrendingUp, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const stats = [
    {
      title: "Total de Pacientes",
      value: "1,247",
      change: "+12% este mês",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Consultas Hoje",
      value: "18",
      change: "6 confirmadas",
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Receita Mensal",
      value: "R$ 85.420",
      change: "+8% vs mês anterior",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Prontuários",
      value: "892",
      change: "24 novos esta semana",
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const upcomingAppointments = [
    {
      time: "09:00",
      patient: "Maria Silva",
      type: "Consulta",
      doctor: "Dr. João",
      status: "confirmed"
    },
    {
      time: "10:30",
      patient: "Pedro Santos",
      type: "Retorno",
      doctor: "Dra. Ana",
      status: "pending"
    },
    {
      time: "14:00",
      patient: "Luiza Costa",
      type: "Primeira Consulta",
      doctor: "Dr. João",
      status: "confirmed"
    },
    {
      time: "15:30",
      patient: "Carlos Oliveira",
      type: "Consulta",
      doctor: "Dra. Maria",
      status: "pending"
    }
  ];

  const recentActivities = [
    {
      action: "Novo paciente cadastrado",
      patient: "Ana Beatriz",
      time: "há 2 horas",
      type: "patient"
    },
    {
      action: "Consulta realizada",
      patient: "João Pedro",
      time: "há 3 horas",
      type: "appointment"
    },
    {
      action: "Pagamento recebido",
      patient: "Maria José",
      time: "há 4 horas",
      type: "payment"
    },
    {
      action: "Prontuário atualizado",
      patient: "Carlos Silva",
      time: "há 5 horas",
      type: "record"
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral da sua clínica</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button variant="outline" size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
          <Button size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Nova Consulta
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Próximas Consultas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium text-gray-900 w-16">
                        {appointment.time}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{appointment.patient}</p>
                        <p className="text-sm text-gray-500">{appointment.type} • {appointment.doctor}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {appointment.status === 'confirmed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  Ver Todas as Consultas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.patient}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Estatísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Taxa de Ocupação</span>
                  <span>87%</span>
                </div>
                <Progress value={87} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Satisfação dos Pacientes</span>
                  <span>92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Meta Mensal</span>
                  <span>68%</span>
                </div>
                <Progress value={68} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
