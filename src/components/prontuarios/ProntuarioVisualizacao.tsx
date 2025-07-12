import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, User, Edit, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useProntuariosPorPaciente, useUpdateProntuario } from '@/hooks/useProntuarios';
import { usePaciente } from '@/hooks/usePacientes';
import { useAuth } from '@/hooks/useAuth';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ProntuarioVisualizacaoProps {
  pacienteId: string;
  prontuarioId?: string | null;
  onVoltar: () => void;
}

export function ProntuarioVisualizacao({ pacienteId, prontuarioId, onVoltar }: ProntuarioVisualizacaoProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [conteudoEditado, setConteudoEditado] = useState('');
  const [prontuariosAbertos, setProntuariosAbertos] = useState<Record<string, boolean>>({});

  const { user } = useAuth();
  const { data: paciente } = usePaciente(pacienteId);
  const { data: prontuarios = [], isLoading } = useProntuariosPorPaciente(pacienteId);
  const updateProntuario = useUpdateProntuario();

  // Effect para abrir automaticamente o prontuário específico
  useEffect(() => {
    if (prontuarioId && prontuarios.length > 0) {
      setProntuariosAbertos(prev => ({
        ...prev,
        [prontuarioId]: true
      }));
    }
  }, [prontuarioId, prontuarios]);

  const handleIniciarEdicao = (prontuario: any) => {
    setEditandoId(prontuario.id);
    setConteudoEditado(prontuario.conteudo);
  };

  const handleCancelarEdicao = () => {
    setEditandoId(null);
    setConteudoEditado('');
  };

  const handleSalvarEdicao = async (id: string) => {
    try {
      await updateProntuario.mutateAsync({
        id,
        data: {
          conteudo: conteudoEditado,
          editado_por: user?.id || null
        }
      });
      setEditandoId(null);
      setConteudoEditado('');
    } catch (error) {
      console.error('Erro ao atualizar prontuário:', error);
    }
  };

  const toggleProntuario = (id: string) => {
    setProntuariosAbertos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getTemplateName = (templateId: string | null) => {
    if (!templateId) return 'Livre';
    if (templateId.includes('soap')) return 'SOAP';
    if (templateId.includes('odonto')) return 'Odontológico';
    return 'Livre';
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando prontuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header com botão de voltar */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Prontuários - {paciente?.nome}</h1>
          <p className="text-muted-foreground mt-1">
            Histórico completo do paciente
          </p>
        </div>
      </div>

      {/* Informações do paciente */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Email:</span>
              <p className="text-muted-foreground">{paciente?.email || 'Não informado'}</p>
            </div>
            <div>
              <span className="font-medium">Telefone:</span>
              <p className="text-muted-foreground">{paciente?.telefone || 'Não informado'}</p>
            </div>
            <div>
              <span className="font-medium">Data de Nascimento:</span>
              <p className="text-muted-foreground">
                {paciente?.data_nascimento 
                  ? new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')
                  : 'Não informado'
                }
              </p>
            </div>
            <div>
              <span className="font-medium">Total de Prontuários:</span>
              <p className="text-muted-foreground">{prontuarios.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de prontuários */}
      <div className="space-y-4">
        {prontuarios.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhum prontuário encontrado para este paciente.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          prontuarios.map((prontuario: any, index: number) => (
            <Card key={prontuario.id} className="overflow-hidden">
              <Collapsible 
                open={prontuariosAbertos[prontuario.id] || index === 0 || prontuarioId === prontuario.id} 
                onOpenChange={() => toggleProntuario(prontuario.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          {prontuariosAbertos[prontuario.id] || index === 0 || prontuarioId === prontuario.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <CardTitle className="text-lg">
                            Prontuário #{prontuarios.length - index}
                          </CardTitle>
                          <Badge variant="outline">
                            {getTemplateName(prontuario.template_id)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground ml-7">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Criado em {new Date(prontuario.criado_em).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>
                              {prontuario.profissionais?.nome || 'Profissional não informado'}
                            </span>
                          </div>
                          {prontuario.ultima_edicao !== prontuario.criado_em && (
                            <span className="text-xs">
                              (Editado em {new Date(prontuario.ultima_edicao).toLocaleDateString('pt-BR')})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {editandoId === prontuario.id ? (
                      <div className="space-y-4">
                        <Textarea
                          value={conteudoEditado}
                          onChange={(e) => setConteudoEditado(e.target.value)}
                          rows={12}
                          className="font-mono text-sm"
                        />
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={handleCancelarEdicao}>
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                          </Button>
                          <Button 
                            onClick={() => handleSalvarEdicao(prontuario.id)}
                            disabled={updateProntuario.isPending}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {updateProntuario.isPending ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                          <pre className="whitespace-pre-wrap text-sm font-mono">
                            {prontuario.conteudo}
                          </pre>
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleIniciarEdicao(prontuario)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}