
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Search, Calendar, User, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { useProntuarios, useProntuariosPorPaciente, useProntuario } from '@/hooks/useProntuarios';
import { usePacientes } from '@/hooks/usePacientes';
import { useProfissionais } from '@/hooks/useProfissionais';
import { ProntuarioModal } from '@/components/prontuarios/ProntuarioModal';
import { TemplateModal } from '@/components/prontuarios/TemplateModal';
import { ProntuarioVisualizacao } from '@/components/prontuarios/ProntuarioVisualizacao';

export default function Prontuarios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const prontuarioId = searchParams.get('id');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [profissionalFilter, setProfissionalFilter] = useState('todos');
  const [pacienteSelecionado, setPacienteSelecionado] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [templateModalAberto, setTemplateModalAberto] = useState(false);

  const { data: prontuarios = [], isLoading: loadingProntuarios } = useProntuarios();
  const { data: pacientes = [], isLoading: loadingPacientes } = usePacientes();
  const { data: profissionais = [], isLoading: loadingProfissionais } = useProfissionais();
  const { data: prontuarioEspecifico } = useProntuario(prontuarioId || '');

  // Effect para detectar prontuário específico na URL
  useEffect(() => {
    if (prontuarioId && prontuarioEspecifico) {
      setPacienteSelecionado(prontuarioEspecifico.paciente_id);
    }
  }, [prontuarioId, prontuarioEspecifico]);

  // Agrupar prontuários por paciente
  const prontuariosPorPaciente = prontuarios.reduce((acc: any, prontuario: any) => {
    const pacienteId = prontuario.paciente_id;
    if (!acc[pacienteId]) {
      acc[pacienteId] = [];
    }
    acc[pacienteId].push(prontuario);
    return acc;
  }, {});

  // Filtrar prontuários
  const prontuariosFiltrados = prontuarios.filter((prontuario: any) => {
    const paciente = pacientes.find(p => p.id === prontuario.paciente_id);
    const nomeMatch = paciente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const profissionalMatch = profissionalFilter === 'todos' || 
      prontuario.profissional_id === profissionalFilter;
    
    return nomeMatch && profissionalMatch;
  });

  // Agrupar prontuários filtrados por paciente
  const pacientesComProntuarios = prontuariosFiltrados.reduce((acc: any, prontuario: any) => {
    const pacienteId = prontuario.paciente_id;
    const paciente = pacientes.find(p => p.id === pacienteId);
    
    if (!acc[pacienteId] && paciente) {
      acc[pacienteId] = {
        paciente,
        prontuarios: []
      };
    }
    
    if (acc[pacienteId]) {
      acc[pacienteId].prontuarios.push(prontuario);
    }
    
    return acc;
  }, {});

  const pacientesArray = Object.values(pacientesComProntuarios);

  // Se um paciente está selecionado, mostrar a visualização dele
  if (pacienteSelecionado) {
    return (
      <ProntuarioVisualizacao 
        pacienteId={pacienteSelecionado}
        prontuarioId={prontuarioId}
        onVoltar={() => {
          setPacienteSelecionado(null);
          setSearchParams({});
        }}
      />
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Prontuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os prontuários dos pacientes
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setTemplateModalAberto(true)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Criar Template
          </Button>
          <Button onClick={() => setModalAberto(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Prontuário
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={profissionalFilter} onValueChange={setProfissionalFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os profissionais</SelectItem>
                {profissionais.map((profissional: any) => (
                  <SelectItem key={profissional.id} value={profissional.id}>
                    {profissional.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pacientes com Prontuários */}
      {loadingProntuarios || loadingPacientes ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando prontuários...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pacientesArray.map((item: any) => (
            <Card key={item.paciente.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">{item.paciente.nome}</h3>
                      <Badge variant="secondary">
                        {item.prontuarios.length} prontuário{item.prontuarios.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Último: {new Date(item.prontuarios[0]?.criado_em || '').toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{item.paciente.email || 'Email não informado'}</span>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground line-clamp-2">
                      {item.prontuarios[0]?.conteudo || 'Sem conteúdo disponível'}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPacienteSelecionado(item.paciente.id)}
                    >
                      Visualizar Histórico
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pacientesArray.length === 0 && !loadingProntuarios && !loadingPacientes && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Nenhum prontuário encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Comece criando o primeiro prontuário para seus pacientes.
              </p>
              <Button onClick={() => setModalAberto(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Prontuário
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ProntuarioModal 
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      />
      
      <TemplateModal 
        isOpen={templateModalAberto}
        onClose={() => setTemplateModalAberto(false)}
      />
    </div>
  );
}
