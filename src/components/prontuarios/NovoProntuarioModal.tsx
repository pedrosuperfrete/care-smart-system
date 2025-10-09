import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateProntuario, useModelosProntuarios } from '@/hooks/useProntuarios';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useAuth } from '@/hooks/useAuth';
import { useProfissionais } from '@/hooks/useProfissionais';
import { toast } from 'sonner';
import { TemplateModal } from './TemplateModal';
import { Plus } from 'lucide-react';

interface NovoProntuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteId: string;
}

export function NovoProntuarioModal({ isOpen, onClose, pacienteId }: NovoProntuarioModalProps) {
  const [templateSelecionado, setTemplateSelecionado] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const { user } = useAuth();
  const { data: agendamentos = [] } = useAgendamentos();
  const { data: templates = [] } = useModelosProntuarios();
  const { data: profissionais = [] } = useProfissionais();
  const createProntuario = useCreateProntuario();

  // Buscar o profissional atual
  const profissionalAtual = profissionais.find(p => p.user_id === user?.id);

  // Filtrar agendamentos realizados do paciente selecionado
  const agendamentosRealizados = agendamentos.filter(
    (ag: any) => 
      ag.paciente_id === pacienteId && 
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

  const resetForm = () => {
    setTemplateSelecionado('');
    setConteudo('');
    setAgendamentoSelecionado('');
  };

  const handleSubmit = async () => {
    if (!conteudo.trim()) {
      toast.error('Por favor, preencha o conteúdo do prontuário');
      return;
    }

    if (!profissionalAtual) {
      toast.error('Profissional não encontrado. Verifique seu perfil.');
      return;
    }

    try {
      await createProntuario.mutateAsync({
        paciente_id: pacienteId,
        profissional_id: profissionalAtual.id,
        conteudo: conteudo.trim(),
        template_id: templateSelecionado || null,
        agendamento_id: agendamentoSelecionado || null,
        editado_por: user?.id || null
      });

      onClose();
      resetForm();
    } catch (error) {
      console.error('Erro ao criar prontuário:', error);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  // Reset form quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Prontuário</DialogTitle>
          <DialogDescription>
            Crie um novo prontuário para este paciente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="template">Template (Opcional)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsTemplateModalOpen(true)}
                className="h-8 gap-1"
              >
                <Plus className="h-4 w-4" />
                Novo
              </Button>
            </div>
            <Select value={templateSelecionado} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template ou deixe em branco" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome} {template.especialidade && `(${template.especialidade})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agendamento relacionado */}
          {agendamentosRealizados.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="agendamento">Agendamento Relacionado (Opcional)</Label>
              <Select value={agendamentoSelecionado} onValueChange={setAgendamentoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um agendamento" />
                </SelectTrigger>
                <SelectContent>
                  {agendamentosRealizados.map((agendamento: any) => (
                    <SelectItem key={agendamento.id} value={agendamento.id}>
                      {new Date(agendamento.data_inicio).toLocaleDateString('pt-BR')} - {agendamento.tipo_servico}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo do Prontuário *</Label>
            <Textarea
              id="conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Digite o conteúdo do prontuário..."
              className="min-h-[400px] resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createProntuario.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createProntuario.isPending || !conteudo.trim()}
            >
              {createProntuario.isPending ? 'Criando...' : 'Criar Prontuário'}
            </Button>
          </div>
        </div>
      </DialogContent>

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    </Dialog>
  );
}