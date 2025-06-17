
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Search, Calendar, User } from 'lucide-react';

export default function Prontuarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Mock data - substituir por hooks reais
  const prontuarios = [
    {
      id: '1',
      paciente: 'Maria Silva',
      data: '2024-06-15',
      tipo: 'SOAP',
      conteudo: 'Consulta de rotina...',
      profissional: 'Dr. João'
    },
    {
      id: '2',
      paciente: 'José Santos',
      data: '2024-06-14',
      tipo: 'Livre',
      conteudo: 'Acompanhamento...',
      profissional: 'Dr. João'
    }
  ];

  const templates = [
    { id: 'soap', nome: 'SOAP', descricao: 'Subjetivo, Objetivo, Avaliação, Plano' },
    { id: 'odonto', nome: 'Odontológico', descricao: 'Específico para consultas odontológicas' },
    { id: 'livre', nome: 'Livre', descricao: 'Formato livre para anotações' }
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Prontuários</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os prontuários dos pacientes
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Prontuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Prontuário</DialogTitle>
              <DialogDescription>
                Crie um novo prontuário para o paciente selecionado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Paciente</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Maria Silva</SelectItem>
                      <SelectItem value="2">José Santos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea
                  placeholder="Digite o conteúdo do prontuário..."
                  rows={8}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Salvar Prontuário</Button>
              </div>
            </div>
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
                  placeholder="Buscar por paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="soap">SOAP</SelectItem>
                <SelectItem value="odonto">Odontológico</SelectItem>
                <SelectItem value="livre">Livre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Prontuários */}
      <div className="grid gap-4">
        {prontuarios.map((prontuario) => (
          <Card key={prontuario.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-lg">{prontuario.paciente}</h3>
                    <Badge variant="outline">{prontuario.tipo}</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(prontuario.data).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{prontuario.profissional}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 line-clamp-2">
                    {prontuario.conteudo}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {prontuarios.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum prontuário encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Comece criando o primeiro prontuário para seus pacientes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
