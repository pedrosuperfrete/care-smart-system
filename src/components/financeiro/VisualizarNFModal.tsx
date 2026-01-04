import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, FileText, Calendar, Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NotaFiscal {
  id: string;
  numero_nf: string | null;
  status_emissao: 'emitida' | 'pendente' | 'erro' | null;
  link_nf: string | null;
  data_emissao: string | null;
  valor_nf: number | null;
}

interface VisualizarNFModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notaFiscal: NotaFiscal | null;
}

export function VisualizarNFModal({ open, onOpenChange, notaFiscal }: VisualizarNFModalProps) {
  if (!notaFiscal) return null;

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'emitida':
        return <Badge>Emitida</Badge>;
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'erro':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Nota Fiscal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Número e Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Número da NF</p>
              <p className="text-lg font-semibold">{notaFiscal.numero_nf || 'Aguardando...'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              {getStatusBadge(notaFiscal.status_emissao)}
            </div>
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-2 gap-4">
            {notaFiscal.data_emissao && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Data de Emissão</p>
                  <p className="text-sm font-medium">
                    {format(new Date(notaFiscal.data_emissao), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
            {notaFiscal.valor_nf !== null && (
              <div className="flex items-start gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="text-sm font-medium">{formatCurrency(notaFiscal.valor_nf)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          {notaFiscal.link_nf && (
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild className="w-full">
                <a href={notaFiscal.link_nf} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar NF (PDF)
                </a>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <a href={notaFiscal.link_nf} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir em Nova Aba
                </a>
              </Button>
            </div>
          )}

          {!notaFiscal.link_nf && notaFiscal.status_emissao === 'pendente' && (
            <p className="text-sm text-muted-foreground text-center py-2">
              A nota fiscal está sendo processada. O link estará disponível em breve.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
