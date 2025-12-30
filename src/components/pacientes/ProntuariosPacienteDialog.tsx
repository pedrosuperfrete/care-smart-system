import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User, ChevronRight, Plus, ArrowLeft } from 'lucide-react';
import { useProntuarios } from '@/hooks/useProntuarios';
import { ProntuarioVisualizacao } from '@/components/prontuarios/ProntuarioVisualizacao';
import { NovoProntuarioModal } from '@/components/prontuarios/NovoProntuarioModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProntuariosPacienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteId: string;
  pacienteNome: string;
}

export function ProntuariosPacienteDialog({ 
  open, 
  onOpenChange, 
  pacienteId, 
  pacienteNome 
}: ProntuariosPacienteDialogProps) {
  const { data: allProntuarios = [], isLoading } = useProntuarios();
  const [selectedProntuarioId, setSelectedProntuarioId] = useState<string | null>(null);
  const [isNovoProntuarioOpen, setIsNovoProntuarioOpen] = useState(false);
  const [showVisualizacao, setShowVisualizacao] = useState(false);
  
  // Filtrar prontuários do paciente e ordenar por data (mais recente primeiro)
  const prontuariosPaciente = allProntuarios
    .filter(p => p.paciente_id === pacienteId)
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

  const handleClose = () => {
    setSelectedProntuarioId(null);
    setShowVisualizacao(false);
    onOpenChange(false);
  };

  const handleProntuarioClick = (prontuarioId: string) => {
    setSelectedProntuarioId(prontuarioId);
    setShowVisualizacao(true);
  };

  const handleVoltarLista = () => {
    setSelectedProntuarioId(null);
    setShowVisualizacao(false);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const timeFormatted = minutes === '00' ? `${hours}h` : `${hours}h${minutes}`;
    return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) + ` às ${timeFormatted}`;
  };

  // Se estiver visualizando um prontuário, mostrar o componente de visualização
  if (showVisualizacao) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ProntuarioVisualizacao
            pacienteId={pacienteId}
            prontuarioId={selectedProntuarioId}
            onVoltar={handleVoltarLista}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Prontuários de {pacienteNome}
            </DialogTitle>
            <DialogDescription>
              Lista de todos os prontuários do paciente ordenados por data
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end mb-2">
            <Button size="sm" onClick={() => setIsNovoProntuarioOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Prontuário
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : prontuariosPaciente.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum prontuário encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Este paciente ainda não possui prontuários registrados.
              </p>
              <Button onClick={() => setIsNovoProntuarioOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Prontuário
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-3">
                {prontuariosPaciente.map((prontuario) => (
                  <Card 
                    key={prontuario.id} 
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleProntuarioClick(prontuario.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {formatDate(prontuario.criado_em)}
                            </span>
                            {prontuario.ultima_edicao !== prontuario.criado_em && (
                              <Badge variant="outline" className="text-xs">
                                Editado
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {prontuario.conteudo 
                              ? prontuario.conteudo.replace(/<[^>]*>/g, '').substring(0, 150) + 
                                (prontuario.conteudo.length > 150 ? '...' : '')
                              : 'Sem conteúdo'
                            }
                          </p>

                          {prontuario.profissionais && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{(prontuario.profissionais as any).nome}</span>
                            </div>
                          )}
                        </div>
                        
                        <ChevronRight className="h-5 w-5 text-muted-foreground ml-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para criar novo prontuário */}
      <NovoProntuarioModal
        isOpen={isNovoProntuarioOpen}
        onClose={() => setIsNovoProntuarioOpen(false)}
        pacienteId={pacienteId}
      />
    </>
  );
}
