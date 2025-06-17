
import { useState } from "react";
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Users, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');

  const appointments = [
    {
      id: 1,
      time: "08:00",
      duration: 60,
      patient: "Maria Silva",
      type: "Consulta",
      doctor: "Dr. João Silva",
      status: "confirmed",
      room: "Sala 1"
    },
    {
      id: 2,
      time: "09:30",
      duration: 30,
      patient: "Pedro Santos",
      type: "Retorno",
      doctor: "Dr. João Silva",
      status: "pending",
      room: "Sala 1"
    },
    {
      id: 3,
      time: "10:00",
      duration: 60,
      patient: "Ana Costa",
      type: "Primeira consulta",
      doctor: "Dra. Ana Maria",
      status: "confirmed",
      room: "Sala 2"
    },
    {
      id: 4,
      time: "11:00",
      duration: 45,
      patient: "Carlos Oliveira",
      type: "Consulta",
      doctor: "Dr. João Silva",
      status: "completed",
      room: "Sala 1"
    },
    {
      id: 5,
      time: "14:00",
      duration: 60,
      patient: "Luiza Ferreira",
      type: "Consulta",
      doctor: "Dra. Ana Maria",
      status: "confirmed",
      room: "Sala 2"
    },
    {
      id: 6,
      time: "15:30",
      duration: 30,
      patient: "Roberto Silva",
      type: "Retorno",
      doctor: "Dr. João Silva",
      status: "pending",
      room: "Sala 1"
    }
  ];

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8; // 8h às 19h
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-3 h-3" />;
      case 'pending': return <AlertCircle className="w-3 h-3" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-600">Gerencie os atendimentos da clínica</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Profissionais
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Consulta
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 capitalize">
                  {formatDate(currentDate)}
                </h2>
                <p className="text-sm text-gray-500">
                  {appointments.length} consultas agendadas
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant={view === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('day')}
              >
                Dia
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Semana
              </Button>
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
              >
                Mês
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Schedule */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Agenda do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {timeSlots.map((time) => {
                  const appointment = appointments.find(apt => apt.time === time);
                  
                  return (
                    <div key={time} className="flex items-center min-h-[60px] border-b border-gray-100 last:border-0">
                      <div className="w-16 text-sm font-medium text-gray-600 flex-shrink-0">
                        {time}
                      </div>
                      <div className="flex-1 ml-4">
                        {appointment ? (
                          <div className={`p-3 rounded-lg border ${getStatusColor(appointment.status)} hover:shadow-sm transition-shadow cursor-pointer`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  {getStatusIcon(appointment.status)}
                                  <span className="font-medium">{appointment.patient}</span>
                                </div>
                                <div className="text-sm opacity-80">
                                  {appointment.type} • {appointment.doctor} • {appointment.room}
                                </div>
                              </div>
                              <div className="text-xs opacity-70">
                                {appointment.duration}min
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 text-center hover:border-primary hover:text-primary transition-colors cursor-pointer">
                            <Plus className="w-4 h-4 mx-auto mb-1" />
                            <span className="text-sm">Horário disponível</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total de consultas</span>
                <Badge variant="secondary">{appointments.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confirmadas</span>
                <Badge className="bg-green-100 text-green-800">
                  {appointments.filter(a => a.status === 'confirmed').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pendentes</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {appointments.filter(a => a.status === 'pending').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Concluídas</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {appointments.filter(a => a.status === 'completed').length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Nova Consulta
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Ver Semana
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Salas
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lembretes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">2 confirmações pendentes</span>
                </div>
                <p className="text-xs text-yellow-700">
                  Pedro Santos e Roberto Silva ainda não confirmaram
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Próxima consulta em 30min</span>
                </div>
                <p className="text-xs text-blue-700">
                  Maria Silva - Consulta - Sala 1
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Agenda;
