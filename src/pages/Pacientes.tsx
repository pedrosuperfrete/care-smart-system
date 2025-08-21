
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PacienteForm } from '@/components/forms/PacienteForm';
import { PacienteDetalhes } from '@/components/PacienteDetalhes';
import { AgendamentoForm } from '@/components/forms/AgendamentoForm';
import { usePacientes, usePacientesStats } from '@/hooks/usePacientes';
import { Users, Plus, Search, MoreVertical, Eye, Edit, Calendar, History, Phone, Mail, MapPin } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { fromLocalDateString } from '@/lib/dateUtils';

type Paciente = Tables<'pacientes'>;

export default function Pacientes() {
  const { data: pacientes = [], isLoading } = usePacientes();
  const { data: stats } = usePacientesStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'adimplentes' | 'inadimplentes'>('todos');
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [isNewPacienteOpen, setIsNewPacienteOpen] = useState(false);
  const [isEditPacienteOpen, setIsEditPacienteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAgendamentoOpen, setIsAgendamentoOpen] = useState(false);

  const filteredPacientes = pacientes.filter(paciente => {
    // Busca dinâmica por nome, CPF ou email (case-insensitive)
    const searchLower = searchTerm.toLowerCase().trim();
    if (searchLower) {
      const nomeMatch = paciente.nome.toLowerCase().includes(searchLower);
      const cpfMatch = paciente.cpf.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''));
      const emailMatch = paciente.email && paciente.email.toLowerCase().includes(searchLower);
      
      if (!nomeMatch && !cpfMatch && !emailMatch) {
        return false;
      }
    }
    
    // Filtro por status de inadimplência
    if (filtroStatus === 'inadimplentes' && !paciente.inadimplente) {
      return false;
    }
    if (filtroStatus === 'adimplentes' && (paciente.inadimplente !== false)) {
      return false;
    }
    
    return true;
  });

  const getTipoPacienteColor = (tipoPaciente: string | null) => {
    const colors = {
      novo: 'bg-blue-100 text-blue-800',
      recorrente: 'bg-yellow-100 text-yellow-800',
      antigo: 'bg-green-100 text-green-800'
    };
    return colors[tipoPaciente as keyof typeof colors] || colors.novo;
  };

  const getTipoPacienteText = (tipoPaciente: string | null) => {
    const texts = {
      novo: 'Novo',
      recorrente: 'Recorrente',
      antigo: 'Antigo'
    };
    return texts[tipoPaciente as keyof typeof texts] || 'Novo';
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os pacientes cadastrados na clínica
          </p>
        </div>
        
        <Dialog open={isNewPacienteOpen} onOpenChange={setIsNewPacienteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Paciente</DialogTitle>
              <DialogDescription>
                Cadastre um novo paciente na clínica
              </DialogDescription>
            </DialogHeader>
            <PacienteForm onSuccess={() => setIsNewPacienteOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros e Estatísticas */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, CPF ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Contadores de Status */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button
                variant={filtroStatus === 'todos' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('todos')}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <span>Todos ({stats?.total || 0})</span>
              </Button>
              <Button
                variant={filtroStatus === 'adimplentes' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('adimplentes')}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <span>Adimplentes ({stats?.adimplentes || 0})</span>
              </Button>
              <Button
                variant={filtroStatus === 'inadimplentes' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('inadimplentes')}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <span>Inadimplentes ({stats?.inadimplentes || 0})</span>
              </Button>
            </div>
            
            {/* Resultado da busca */}
            {searchTerm && (
              <div className="text-sm text-gray-600">
                Exibindo {filteredPacientes.length} de {pacientes.length} pacientes
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pacientes */}
      <div className="grid gap-4">
        {filteredPacientes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'Tente ajustar os filtros de busca ou digite outro termo.' 
                    : 'Comece cadastrando o primeiro paciente da clínica.'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsNewPacienteOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Primeiro Paciente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredPacientes.map((paciente) => (
            <Card key={paciente.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{paciente.nome}</h3>
                      <Badge className={getTipoPacienteColor(paciente.tipo_paciente)}>
                        {getTipoPacienteText(paciente.tipo_paciente)}
                      </Badge>
                      {paciente.inadimplente && (
                        <Badge className="bg-red-100 text-red-800">
                          Inadimplente
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="space-y-2">
                        <p><strong>CPF:</strong> {paciente.cpf}</p>
                        {paciente.data_nascimento && (
                          <p><strong>Nascimento:</strong> {fromLocalDateString(paciente.data_nascimento).toLocaleDateString('pt-BR')}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {paciente.telefone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4" />
                            <span>{paciente.telefone}</span>
                          </div>
                        )}
                        {paciente.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{paciente.email}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {paciente.endereco && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span className="line-clamp-2">{paciente.endereco}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {paciente.observacoes && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">
                          <strong>Observações:</strong> {paciente.observacoes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex sm:flex-col items-end gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <MoreVertical className="h-4 w-4" />
                          <span className="ml-2 sm:hidden">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => {
                        setSelectedPaciente(paciente);
                        setIsDetailsOpen(true);
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedPaciente(paciente);
                        setIsEditPacienteOpen(true);
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedPaciente(paciente);
                        setIsAgendamentoOpen(true);
                      }}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Novo Atendimento
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedPaciente(paciente);
                        setIsDetailsOpen(true);
                      }}>
                        <History className="mr-2 h-4 w-4" />
                        Histórico
                      </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Sheet de Detalhes do Paciente */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="w-full sm:w-[500px] md:w-[700px] lg:w-[900px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do Paciente</SheetTitle>
            <SheetDescription>
              Informações completas e histórico do paciente
            </SheetDescription>
          </SheetHeader>
          
          {selectedPaciente && (
            <div className="mt-6">
              <PacienteDetalhes 
                pacienteId={selectedPaciente.id} 
                onClose={() => setIsDetailsOpen(false)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog de Edição do Paciente */}
      <Dialog open={isEditPacienteOpen} onOpenChange={setIsEditPacienteOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>
              Atualize as informações do paciente
            </DialogDescription>
          </DialogHeader>
          {selectedPaciente && (
            <PacienteForm 
              paciente={selectedPaciente}
              onSuccess={() => {
                setIsEditPacienteOpen(false);
                setSelectedPaciente(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Novo Agendamento */}
      <Dialog open={isAgendamentoOpen} onOpenChange={setIsAgendamentoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Agendar nova consulta para {selectedPaciente?.nome}
            </DialogDescription>
          </DialogHeader>
          {selectedPaciente && (
            <AgendamentoForm 
              pacienteId={selectedPaciente.id}
              onSuccess={() => {
                setIsAgendamentoOpen(false);
                setSelectedPaciente(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
