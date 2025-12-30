
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { usePacientesComAgendamentos } from '@/hooks/usePacientesComAgendamentos';
import { Users, Plus, Search, MoreVertical, FileText, Edit, Calendar, History, Phone, Mail, MapPin, FileUp } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { fromLocalDateString } from '@/lib/dateUtils';
import { ImportPacientesDialog } from '@/components/pacientes/ImportPacientesDialog';
import { ProntuariosPacienteDialog } from '@/components/pacientes/ProntuariosPacienteDialog';

type Paciente = Tables<'pacientes'>;

export default function Pacientes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: pacientes = [], isLoading } = usePacientes();
  const { data: stats } = usePacientesStats();
  const { data: pacientesComAgendamentos } = usePacientesComAgendamentos();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'adimplentes' | 'inadimplentes'>('todos');
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [isNewPacienteOpen, setIsNewPacienteOpen] = useState(false);
  const [isEditPacienteOpen, setIsEditPacienteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAgendamentoOpen, setIsAgendamentoOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isProntuariosOpen, setIsProntuariosOpen] = useState(false);

  // Abrir detalhes automaticamente se houver ID na URL
  useEffect(() => {
    const pacienteId = searchParams.get('id');
    if (pacienteId && pacientes.length > 0) {
      const paciente = pacientes.find(p => p.id === pacienteId);
      if (paciente) {
        setSelectedPaciente(paciente);
        setIsDetailsOpen(true);
        // Limpar o parâmetro da URL
        searchParams.delete('id');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, pacientes, setSearchParams]);

  // Função para remover acentos para busca mais flexível
  const removeAcentos = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const filteredPacientes = pacientes.filter(paciente => {
    // Busca dinâmica por nome, CPF ou email (case-insensitive e sem acentos)
    const searchLower = removeAcentos(searchTerm.toLowerCase().trim());
    if (searchLower) {
      const nomeLower = removeAcentos(paciente.nome?.toLowerCase() || '');
      const nomeMatch = nomeLower.includes(searchLower);

      const numericSearch = searchTerm.replace(/\D/g, '').trim();
      const cpfMatch = numericSearch
        ? (paciente.cpf ? paciente.cpf.replace(/\D/g, '').includes(numericSearch) : false)
        : false;
      const emailMatch = paciente.email ? paciente.email.toLowerCase().includes(searchLower) : false;
      const telefoneMatch = numericSearch
        ? (paciente.telefone ? paciente.telefone.replace(/\D/g, '').includes(numericSearch) : false)
        : false;
      
      if (!nomeMatch && !cpfMatch && !emailMatch && !telefoneMatch) {
        return false;
      }
    }
    
    // Verificar se o paciente tem agendamentos
    const temAgendamentos = pacientesComAgendamentos?.has(paciente.id) || false;
    
    // Filtro por status de inadimplência
    if (filtroStatus === 'inadimplentes' && !paciente.inadimplente) {
      return false;
    }
    // Adimplentes: pacientes que NÃO são inadimplentes E que já tiveram consulta
    if (filtroStatus === 'adimplentes' && (!temAgendamentos || paciente.inadimplente === true)) {
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
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Importar Pacientes
          </Button>
          
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
                  {searchTerm 
                    ? 'Nenhum paciente encontrado' 
                    : filtroStatus === 'inadimplentes' 
                      ? 'Nenhum paciente Inadimplente' 
                      : filtroStatus === 'adimplentes'
                        ? 'Nenhum paciente Adimplente'
                        : 'Nenhum paciente cadastrado'
                  }
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'Tente ajustar os filtros de busca ou digite outro termo.' 
                    : filtroStatus === 'inadimplentes'
                      ? 'Não há pacientes inadimplentes no momento.'
                      : filtroStatus === 'adimplentes'
                        ? 'Não há pacientes adimplentes no momento.'
                        : 'Comece cadastrando o primeiro paciente da clínica.'
                  }
                </p>
                {!searchTerm && filtroStatus === 'todos' && (
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
            <Card 
              key={paciente.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedPaciente(paciente);
                setIsEditPacienteOpen(true);
              }}
            >
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
                  
                  <div 
                    className="flex sm:flex-col items-end gap-2 w-full sm:w-auto mt-4 sm:mt-0"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                        setIsProntuariosOpen(true);
                      }}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Prontuários
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

      {/* Dialog de Visualização/Edição do Paciente */}
      <Dialog open={isEditPacienteOpen} onOpenChange={setIsEditPacienteOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
            <DialogDescription>
              Visualize ou edite as informações do paciente
            </DialogDescription>
          </DialogHeader>
          {selectedPaciente && (
            <PacienteForm 
              paciente={selectedPaciente}
              viewMode={true}
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

      {/* Dialog de Importação de Pacientes */}
      <ImportPacientesDialog 
        open={isImportOpen} 
        onOpenChange={setIsImportOpen}
      />

      {/* Dialog de Prontuários do Paciente */}
      <ProntuariosPacienteDialog
        open={isProntuariosOpen}
        onOpenChange={(open) => {
          setIsProntuariosOpen(open);
          if (!open) setSelectedPaciente(null);
        }}
        pacienteId={selectedPaciente?.id || ''}
        pacienteNome={selectedPaciente?.nome || ''}
      />
    </div>
  );
}
