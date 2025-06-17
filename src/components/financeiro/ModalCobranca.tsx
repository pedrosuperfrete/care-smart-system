
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, MessageCircle, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface ModalCobrancaProps {
  isOpen: boolean;
  onClose: () => void;
  pagamento: {
    id: string;
    paciente: string;
    servico: string;
    valor: number;
    data: string;
    telefone?: string;
  };
}

export function ModalCobranca({ isOpen, onClose, pagamento }: ModalCobrancaProps) {
  const linkPagamento = `https://seusite.com/pagamento/${pagamento.id}`;
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${pagamento.id}5204000053039865802BR5925CLINICA EXEMPLO6009SAO PAULO62070503***6304`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(linkPagamento);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleSendWhatsApp = () => {
    const telefone = pagamento.telefone?.replace(/\D/g, '') || '';
    const mensagem = `Olá ${pagamento.paciente}! 
    
Cobrança referente ao serviço: ${pagamento.servico}
Valor: R$ ${pagamento.valor.toFixed(2)}
Data: ${new Date(pagamento.data).toLocaleDateString('pt-BR')}

Link para pagamento: ${linkPagamento}

Agradecemos sua preferência!`;

    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cobrança - {pagamento.paciente}</DialogTitle>
          <DialogDescription>
            Detalhes da cobrança e opções de envio
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Paciente:</strong> {pagamento.paciente}
            </div>
            <div>
              <strong>Serviço:</strong> {pagamento.servico}
            </div>
            <div>
              <strong>Valor:</strong> R$ {pagamento.valor.toFixed(2)}
            </div>
            <div>
              <strong>Data:</strong> {new Date(pagamento.data).toLocaleDateString('pt-BR')}
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div>
              <strong>Link de Pagamento:</strong>
              <div className="flex items-center space-x-2 mt-1">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1 truncate">
                  {linkPagamento}
                </code>
                <Button size="sm" variant="outline" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <strong>PIX Copia e Cola:</strong>
              <div className="flex items-center space-x-2 mt-1">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1 truncate">
                  {pixCode}
                </code>
                <Button size="sm" variant="outline" onClick={() => {
                  navigator.clipboard.writeText(pixCode);
                  toast.success('Código PIX copiado!');
                }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                <QrCode className="h-16 w-16 text-gray-400" />
                <span className="text-xs text-gray-500 ml-2">QR Code PIX</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSendWhatsApp} className="flex-1">
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar por WhatsApp
            </Button>
            <Button variant="outline" onClick={handleCopyLink} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
