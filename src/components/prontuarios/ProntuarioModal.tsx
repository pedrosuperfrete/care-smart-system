import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProntuario, useModelosProntuarios } from '@/hooks/useProntuarios';
import { usePacientes } from '@/hooks/usePacientes';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useAuth } from '@/hooks/useAuth';
import { useProfissionais } from '@/hooks/useProfissionais';
import { Edit, Trash2 } from 'lucide-react';
import { TemplateModal } from './TemplateModal';
import { useDeleteTemplate } from '@/hooks/useProntuarios';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ProntuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProntuarioModal({ isOpen, onClose }: ProntuarioModalProps) {
  const [pacienteSelecionado, setPacienteSelecionado] = useState('');
  const [templateSelecionado, setTemplateSelecionado] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const { user } = useAuth();
  const { data: pacientes = [] } = usePacientes();
  const { data: agendamentos = [] } = useAgendamentos();
  const { data: templates = [] } = useModelosProntuarios();
  const { data: profissionais = [] } = useProfissionais();
  const createProntuario = useCreateProntuario();
  const deleteTemplate = useDeleteTemplate();

  // Buscar o profissional atual
  const profissionalAtual = profissionais.find(p => p.user_id === user?.id);

  // Filtrar agendamentos realizados do paciente selecionado
  const agendamentosRealizados = agendamentos.filter(
    (ag: any) => 
      ag.paciente_id === pacienteSelecionado && 
      ag.status === 'realizado'
  );

  const handleTemplateChange = (templateId: string) => {
    setTemplateSelecionado(templateId);
    if (templateId) {
      const selectedTemplate = templates.find(t => t.id === templateId);
      if (selectedTemplate) {
        setConteudo(selectedTemplate.conteudo || '');
      }
    } else {
      setConteudo('');
    }
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate.mutateAsync(templateId);
    } catch (error) {
      console.error('Erro ao excluir template:', error);
    }
  };

  const handleSubmit = async () => {
    if (!pacienteSelecionado || !conteudo.trim()) {
      toast.error('Por favor, preencha todos os campos obrigatórios (Paciente e Conteúdo)');
      return;
    }

    if (!profissionalAtual) {
      toast.error('Profissional não encontrado. Verifique seu perfil.');
      return;
    }

    try {
      await createProntuario.mutateAsync({
        paciente_id: pacienteSelecionado,
        profissional_id: profissionalAtual.id,
        conteudo: conteudo.trim(),
        template_id: templateSelecionado || null,
        agendamento_id: agendamentoSelecionado || null,
        editado_por: user?.id || null
      });

      onClose();
      // Resetar form
      setPacienteSelecionado('');
      setTemplateSelecionado('');
      setConteudo('');
      setAgendamentoSelecionado('');
    } catch (error) {
      console.error('Erro ao criar prontuário:', error);
    }
  };

  const handleClose = () => {
    onClose();
    // Resetar form
    setPacienteSelecionado('');
    setTemplateSelecionado('');
    setConteudo('');
    setAgendamentoSelecionado('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Prontuário</DialogTitle>
          <DialogDescription>
            Crie um novo prontuário para o paciente selecionado
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select value={pacienteSelecionado} onValueChange={setPacienteSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((paciente: any) => (
                    <SelectItem key={paciente.id} value={paciente.id}>
                      {paciente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                Template
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTemplateModal(true)}
                    className="h-6 px-2 text-xs"
                  >
                    + Novo
                  </Button>
                  {templateSelecionado && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const template = templates.find(t => t.id === templateSelecionado);
                          if (template) handleEditTemplate(template);
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Template</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTemplate(templateSelecionado)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </Label>
              <Select value={templateSelecionado} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(template => template.id).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.nome} {template.especialidade && `(${template.especialidade})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {pacienteSelecionado && agendamentosRealizados.length > 0 && (
            <div className="space-y-2">
              <Label>Consulta Vinculada (Opcional)</Label>
              <Select value={agendamentoSelecionado} onValueChange={setAgendamentoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma consulta (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {agendamentosRealizados.filter(agendamento => agendamento.id).map((agendamento: any) => (
                    <SelectItem key={agendamento.id} value={agendamento.id}>
                      {agendamento.tipo_servico} - {new Date(agendamento.data_inicio).toLocaleDateString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Conteúdo *</Label>
            <Textarea
              placeholder="Digite o conteúdo do prontuário..."
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={16}
              className="font-mono text-sm"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!pacienteSelecionado || !conteudo.trim() || createProntuario.isPending}
            >
              {createProntuario.isPending ? 'Salvando...' : 'Salvar Prontuário'}
            </Button>
          </div>
        </div>
      </DialogContent>
      
      <TemplateModal 
        isOpen={showTemplateModal} 
        onClose={() => {
          setShowTemplateModal(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate}
      />
    </Dialog>
  );
}