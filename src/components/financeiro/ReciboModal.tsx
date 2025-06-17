
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ReciboModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagamento: {
    id: string;
    valor_pago: number;
    data_pagamento: string | null;
    agendamentos?: {
      tipo_servico: string;
      pacientes?: {
        nome: string;
        telefone?: string | null;
      } | null;
    } | null;
  } | null;
}

export function ReciboModal({ open, onOpenChange, pagamento }: ReciboModalProps) {
  if (!pagamento) return null;

  const pacienteNome = pagamento.agendamentos?.pacientes?.nome || 'Nome não disponível';
  const tipoServico = pagamento.agendamentos?.tipo_servico || 'Serviço não especificado';
  const valorPago = Number(pagamento.valor_pago) || 0;
  const dataPagamento = pagamento.data_pagamento 
    ? new Date(pagamento.data_pagamento).toLocaleDateString('pt-BR')
    : 'Data não disponível';

  const handleImprimir = () => {
    window.print();
    console.log('Imprimindo recibo do pagamento:', pagamento.id);
  };

  const handleEnviarEmail = () => {
    toast.success('Funcionalidade de envio por email será implementada em breve');
    console.log('Enviando recibo por email para:', pacienteNome);
  };

  const handleEnviarWhatsApp = () => {
    const telefone = pagamento.agendamentos?.pacientes?.telefone;
    if (telefone) {
      const mensagem = `Olá ${pacienteNome}! Seu recibo de pagamento:\n\nServiço: ${tipoServico}\nValor: R$ ${valorPago.toFixed(2)}\nData: ${dataPagamento}\n\nObrigado!`;
      const url = `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, '_blank');
      console.log('Enviando recibo por WhatsApp para:', telefone);
    } else {
      toast.error('Telefone do paciente não encontrado');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Recibo de Pagamento</DialogTitle>
          <DialogDescription>
            Detalhes do pagamento realizado
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 p-4 bg-gray-50 rounded-lg">
            <div>
              <strong>Paciente:</strong> {pacienteNome}
            </div>
            <div>
              <strong>Serviço:</strong> {tipoServico}
            </div>
            <div>
              <strong>Valor Pago:</strong> R$ {valorPago.toFixed(2)}
            </div>
            <div>
              <strong>Data do Pagamento:</strong> {dataPagamento}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleImprimir}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleEnviarEmail}>
              <Mail className="h-4 w-4 mr-2" />
              E-mail
            </Button>
            <Button onClick={handleEnviarWhatsApp}>
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
