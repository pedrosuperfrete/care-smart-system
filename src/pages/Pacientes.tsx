import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PacienteForm } from '@/components/forms/PacienteForm';
import { usePacientes } from '@/hooks/usePacientes';
import { Users, Plus, Search, MoreVertical, Eye, Edit, Calendar, History, Phone, Mail, MapPin } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Paciente = Tables<'pacientes'>;

export default function Pacientes() {
  const { data: pacientes = [], isLoading } = usePacientes();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [isNewPacienteOpen, setIsNewPacienteOpen] = useState(false);
  const [isEditPacienteOpen, setIsEditPacienteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const filteredPacientes = pacientes.filter(paciente =>
    paciente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paciente.cpf.includes(searchTerm.replace(/\D/g, '')) ||
    (paciente.email && paciente.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRiscoColor = (risco: string | null) => {
    const colors = {
      baixo: 'bg-green-100 text-green-800',
      medio: 'bg-yellow-100 text-yellow-800',
      alto: 'bg-red-100 text-red-800'
    };
    return colors[risco as keyof typeof colors] || colors.baixo;
  };

  const getRiscoText = (risco: string | null) => {
    const texts = {
      baixo: 'Baixo',
      medio: 'Médio',
      alto: 'Alto'
    };
    return texts[risco as keyof typeof texts] || 'Baixo';
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

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
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
                    ? 'Tente ajustar os filtros de busca.' 
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
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold">{paciente.nome}</h3>
                      <Badge className={getRiscoColor(paciente.risco)}>
                        Risco {getRiscoText(paciente.risco)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="space-y-2">
                        <p><strong>CPF:</strong> {paciente.cpf}</p>
                        {paciente.data_nascimento && (
                          <p><strong>Nascimento:</strong> {new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}</p>
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
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                      <DropdownMenuItem>
                        <Calendar className="mr-2 h-4 w-4" />
                        Novo Atendimento
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <History className="mr-2 h-4 w-4" />
                        Histórico
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Sheet de Detalhes do Paciente */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Detalhes do Paciente</SheetTitle>
            <SheetDescription>
              Informações completas e histórico do paciente
            </SheetDescription>
          </SheetHeader>
          
          {selectedPaciente && (
            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-semibold">{selectedPaciente.nome}</h3>
                  <Badge className={getRiscoColor(selectedPaciente.risco)}>
                    Risco {getRiscoText(selectedPaciente.risco)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>CPF:</strong>
                    <p>{selectedPaciente.cpf}</p>
                  </div>
                  {selectedPaciente.data_nascimento && (
                    <div>
                      <strong>Data de Nascimento:</strong>
                      <p>{new Date(selectedPaciente.data_nascimento).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                  {selectedPaciente.telefone && (
                    <div>
                      <strong>Telefone:</strong>
                      <p>{selectedPaciente.telefone}</p>
                    </div>
                  )}
                  {selectedPaciente.email && (
                    <div>
                      <strong>Email:</strong>
                      <p>{selectedPaciente.email}</p>
                    </div>
                  )}
                </div>
                
                {selectedPaciente.endereco && (
                  <div>
                    <strong>Endereço:</strong>
                    <p className="text-sm">{selectedPaciente.endereco}</p>
                  </div>
                )}
                
                {selectedPaciente.observacoes && (
                  <div>
                    <strong>Observações:</strong>
                    <p className="text-sm">{selectedPaciente.observacoes}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Histórico de Atendimentos</h4>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Nenhum atendimento encontrado para este paciente.
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <Button className="w-full" onClick={() => {
                  setIsDetailsOpen(false);
                  setIsEditPacienteOpen(true);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Paciente
                </Button>
                <Button variant="outline" className="w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  Agendar Consulta
                </Button>
              </div>
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
    </div>
  );
}
