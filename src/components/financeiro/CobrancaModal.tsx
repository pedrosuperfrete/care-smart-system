
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, Copy, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTimeLocal } from '@/lib/dateUtils';

interface CobrancaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagamento: {
    id: string;
    valor_total: number;
    valor_pago: number;
    status: string;
    agendamentos?: {
      tipo_servico: string;
      data_inicio: string;
      pacientes?: {
        nome: string;
        telefone?: string | null;
      } | null;
    } | null;
  } | null;
}

export function CobrancaModal({ open, onOpenChange, pagamento }: CobrancaModalProps) {
  if (!pagamento) return null;

  const pacienteNome = pagamento.agendamentos?.pacientes?.nome || 'Nome não disponível';
  const tipoServico = pagamento.agendamentos?.tipo_servico || 'Serviço não especificado';
  const valorTotal = Number(pagamento.valor_total) || 0;
  const valorPendente = valorTotal - (Number(pagamento.valor_pago) || 0);
  const dataServico = pagamento.agendamentos?.data_inicio 
    ? formatDateTimeLocal(pagamento.agendamentos.data_inicio).split(' ')[0]
    : 'Data não disponível';

  // Link de pagamento fictício (aqui seria integrado com gateway de pagamento)
  const linkPagamento = `https://pagamento.clinica.com/pay/${pagamento.id}`;

  const handleCopiarLink = () => {
    navigator.clipboard.writeText(linkPagamento);
    toast.success('Link de pagamento copiado!');
    console.log('Link copiado:', linkPagamento);
  };

  const handleEnviarWhatsApp = () => {
    const telefone = pagamento.agendamentos?.pacientes?.telefone;
    if (telefone) {
      const mensagem = `Olá ${pacienteNome}! \n\nVocê tem um pagamento pendente:\n\nServiço: ${tipoServico}\nData: ${dataServico}\nValor: R$ ${valorPendente.toFixed(2)}\n\nPague agora: ${linkPagamento}\n\nObrigado!`;
      const url = `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
      window.open(url, '_blank');
      console.log('Enviando cobrança por WhatsApp para:', telefone);
    } else {
      toast.error('Telefone do paciente não encontrado');
    }
  };

  const handleGerarQRCode = () => {
    toast.success('QR Code PIX será implementado em breve');
    console.log('Gerando QR Code PIX para pagamento:', pagamento.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cobrança de Pagamento</DialogTitle>
          <DialogDescription>
            Envie a cobrança para o paciente
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
              <strong>Data:</strong> {dataServico}
            </div>
            <div>
              <strong>Valor a Pagar:</strong> R$ {valorPendente.toFixed(2)}
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Link de Pagamento:</label>
              <div className="flex mt-1">
                <input 
                  type="text" 
                  value={linkPagamento} 
                  readOnly 
                  className="flex-1 px-3 py-2 border rounded-l-md bg-gray-50 text-sm"
                />
                <Button 
                  variant="outline" 
                  onClick={handleCopiarLink}
                  className="rounded-l-none"
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between space-x-2">
              <Button variant="outline" onClick={handleGerarQRCode} className="flex-1">
                <QrCode className="h-4 w-4 mr-2" />
                QR PIX
              </Button>
              <Button onClick={handleEnviarWhatsApp} className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
