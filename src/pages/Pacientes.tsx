
import { useState } from "react";
import { Search, Plus, Filter, MoreVertical, Phone, Mail, Calendar, User, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Pacientes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");

  const pacientes = [
    {
      id: 1,
      nome: "Maria Silva Santos",
      email: "maria.silva@email.com",
      telefone: "(11) 99999-9999",
      cpf: "123.456.789-00",
      dataNascimento: "1985-03-15",
      ultimaConsulta: "2024-06-15",
      status: "adimplente",
      risco: "baixo",
      observacoes: "Paciente colaborativa, histórico de hipertensão"
    },
    {
      id: 2,
      nome: "João Pedro Costa",
      email: "joao.costa@email.com",
      telefone: "(11) 88888-8888",
      cpf: "987.654.321-00",
      dataNascimento: "1990-07-22",
      ultimaConsulta: "2024-06-10",
      status: "inadimplente",
      risco: "medio",
      observacoes: "Paciente com ansiedade, necessita acompanhamento"
    },
    {
      id: 3,
      nome: "Ana Beatriz Lima",
      email: "ana.lima@email.com",
      telefone: "(11) 77777-7777",
      cpf: "456.789.123-00",
      dataNascimento: "1988-12-03",
      ultimaConsulta: "2024-06-12",
      status: "adimplente",
      risco: "alto",
      observacoes: "Histórico familiar de diabetes"
    },
    {
      id: 4,
      nome: "Carlos Eduardo Souza",
      email: "carlos.souza@email.com",
      telefone: "(11) 66666-6666",
      cpf: "789.123.456-00",
      dataNascimento: "1995-04-18",
      ultimaConsulta: "2024-06-08",
      status: "adimplente",
      risco: "baixo",
      observacoes: "Paciente jovem, sem comorbidades"
    },
    {
      id: 5,
      nome: "Lucia Fernanda Oliveira",
      email: "lucia.oliveira@email.com",
      telefone: "(11) 55555-5555",
      cpf: "321.654.987-00",
      dataNascimento: "1978-09-25",
      ultimaConsulta: "2024-06-14",
      status: "inadimplente",
      risco: "medio",
      observacoes: "Tratamento para depressão em andamento"
    }
  ];

  const getStatusColor = (status: string) => {
    return status === "adimplente" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case "baixo": return "bg-green-100 text-green-800";
      case "medio": return "bg-yellow-100 text-yellow-800";
      case "alto": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const filteredPacientes = pacientes.filter(paciente => {
    const matchesSearch = paciente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         paciente.cpf.includes(searchTerm) ||
                         paciente.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === "todos") return matchesSearch;
    if (selectedFilter === "adimplente") return matchesSearch && paciente.status === "adimplente";
    if (selectedFilter === "inadimplente") return matchesSearch && paciente.status === "inadimplente";
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-600">Gerencie todos os pacientes da clínica</p>
        </div>
        <Button className="mt-4 sm:mt-0">
          <Plus className="w-4 h-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
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
            <div className="flex gap-2">
              <Button
                variant={selectedFilter === "todos" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("todos")}
              >
                Todos ({pacientes.length})
              </Button>
              <Button
                variant={selectedFilter === "adimplente" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("adimplente")}
              >
                Adimplentes ({pacientes.filter(p => p.status === "adimplente").length})
              </Button>
              <Button
                variant={selectedFilter === "inadimplente" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("inadimplente")}
              >
                Inadimplentes ({pacientes.filter(p => p.status === "inadimplente").length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPacientes.map((paciente) => (
          <Card key={paciente.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials(paciente.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{paciente.nome}</h3>
                    <p className="text-sm text-gray-500">CPF: {paciente.cpf}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem>Novo Atendimento</DropdownMenuItem>
                    <DropdownMenuItem>Histórico</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{paciente.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{paciente.telefone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Última consulta: {new Date(paciente.ultimaConsulta).toLocaleDateString('pt-BR')}</span>
                </div>
                
                <div className="flex items-center justify-between pt-3">
                  <div className="flex space-x-2">
                    <Badge className={getStatusColor(paciente.status)}>
                      {paciente.status === "adimplente" ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 mr-1" />
                      )}
                      {paciente.status}
                    </Badge>
                    <Badge className={getRiscoColor(paciente.risco)}>
                      Risco {paciente.risco}
                    </Badge>
                  </div>
                </div>
                
                {paciente.observacoes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {paciente.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPacientes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum paciente encontrado</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? "Tente ajustar sua busca" : "Comece adicionando seu primeiro paciente"}
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Paciente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Pacientes;
