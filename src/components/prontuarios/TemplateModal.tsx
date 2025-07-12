import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTemplate, useUpdateTemplate } from '@/hooks/useProntuarios';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: {
    id: string;
    nome: string;
    conteudo: string;
    especialidade?: string;
  } | null;
}

export function TemplateModal({ isOpen, onClose, template }: TemplateModalProps) {
  const [nome, setNome] = useState(template?.nome || '');
  const [conteudo, setConteudo] = useState(template?.conteudo || '');
  const [especialidade, setEspecialidade] = useState(template?.especialidade || '');

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const isEditing = !!template;

  const handleSubmit = async () => {
    if (!nome.trim()) {
      return;
    }

    try {
      if (isEditing) {
        await updateTemplate.mutateAsync({
          id: template.id,
          data: { nome: nome.trim(), conteudo: conteudo.trim(), especialidade: especialidade.trim() || undefined }
        });
      } else {
        await createTemplate.mutateAsync({
          nome: nome.trim(),
          conteudo: conteudo.trim(),
          especialidade: especialidade.trim() || undefined
        });
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    }
  };

  const resetForm = () => {
    setNome('');
    setConteudo('');
    setEspecialidade('');
  };

  const handleClose = () => {
    onClose();
    if (!isEditing) {
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Template' : 'Criar Template'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edite o template de prontuário' : 'Crie um novo template reutilizável de prontuário'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Template *</Label>
              <Input
                placeholder="Ex: SOAP, Odontológico, Consulta de Rotina..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Select value={especialidade} onValueChange={setEspecialidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma especialidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="medicina">Medicina</SelectItem>
                  <SelectItem value="odontologia">Odontologia</SelectItem>
                  <SelectItem value="psicologia">Psicologia</SelectItem>
                  <SelectItem value="fisioterapia">Fisioterapia</SelectItem>
                  <SelectItem value="nutricao">Nutrição</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Conteúdo do Template</Label>
            <Textarea
              placeholder="Digite a estrutura do template..."
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
              disabled={!nome.trim() || createTemplate.isPending || updateTemplate.isPending}
            >
              {createTemplate.isPending || updateTemplate.isPending 
                ? 'Salvando...' 
                : isEditing ? 'Atualizar Template' : 'Criar Template'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}