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

interface ProntuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEMPLATES = {
  soap: {
    nome: 'SOAP',
    conteudo: `**SUBJETIVO**
Queixa principal:
História da doença atual:
Antecedentes pessoais:
Antecedentes familiares:

**OBJETIVO**
Exame físico:
Sinais vitais:
Exames complementares:

**AVALIAÇÃO**
Hipótese diagnóstica:
Diagnóstico diferencial:

**PLANO**
Tratamento:
Prescrições:
Orientações:
Retorno:`
  },
  odonto: {
    nome: 'Odontológico',
    conteudo: `**ANAMNESE**
Queixa principal:
História da doença atual:
Antecedentes médicos:
Medicamentos em uso:

**EXAME CLÍNICO**
Exame extraoral:
Exame intraoral:
Periodonto:
Oclusão:

**DIAGNÓSTICO**
Diagnóstico clínico:

**PLANO DE TRATAMENTO**
Procedimentos indicados:
Orientações de higiene:
Retorno:`
  },
  livre: {
    nome: 'Livre',
    conteudo: ''
  }
};

export function ProntuarioModal({ isOpen, onClose }: ProntuarioModalProps) {
  const [pacienteSelecionado, setPacienteSelecionado] = useState('');
  const [templateSelecionado, setTemplateSelecionado] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState('');

  const { user } = useAuth();
  const { data: pacientes = [] } = usePacientes();
  const { data: agendamentos = [] } = useAgendamentos();
  const createProntuario = useCreateProntuario();

  // Filtrar agendamentos realizados do paciente selecionado
  const agendamentosRealizados = agendamentos.filter(
    (ag: any) => 
      ag.paciente_id === pacienteSelecionado && 
      ag.status === 'realizado'
  );

  const handleTemplateChange = (template: string) => {
    setTemplateSelecionado(template);
    if (template && TEMPLATES[template as keyof typeof TEMPLATES]) {
      setConteudo(TEMPLATES[template as keyof typeof TEMPLATES].conteudo);
    } else {
      setConteudo('');
    }
  };

  const handleSubmit = async () => {
    if (!pacienteSelecionado || !conteudo.trim()) {
      return;
    }

    try {
      await createProntuario.mutateAsync({
        paciente_id: pacienteSelecionado,
        profissional_id: user?.id || '',
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
              <Label>Template</Label>
              <Select value={templateSelecionado} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="soap">SOAP</SelectItem>
                  <SelectItem value="odonto">Odontológico</SelectItem>
                  <SelectItem value="livre">Livre</SelectItem>
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
                  <SelectItem value="">Não vincular consulta</SelectItem>
                  {agendamentosRealizados.map((agendamento: any) => (
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
    </Dialog>
  );
}