import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, FileText, Calendar, Receipt } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotaFiscal {
  id: string;
  numero_nf: string | null;
  status_emissao: "emitida" | "pendente" | "erro" | null;
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
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "emitida":
        return <Badge>Emitida</Badge>;
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "erro":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const downloadPdf = async (mode: "download" | "open") => {
    if (!notaFiscal?.id) return;

    const { data, error } = await supabase.functions.invoke("nfse-download", {
      body: { nota_fiscal_id: notaFiscal.id },
    });

    if (error) {
      const message = (error as any)?.message || "Não foi possível baixar a nota fiscal";
      toast.error(message);
      return;
    }

    const blob = data as Blob;
    const fileName = `nfse-${(notaFiscal.numero_nf || notaFiscal.id).toString()}.pdf`;

    const url = URL.createObjectURL(blob);

    if (mode === "open") {
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      return;
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
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
              <p className="text-lg font-semibold">{notaFiscal.numero_nf || "Aguardando..."}</p>
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
              <Button className="w-full" onClick={() => downloadPdf("download")}> 
                <Download className="h-4 w-4 mr-2" />
                Baixar NF (PDF)
              </Button>
              <Button variant="outline" className="w-full" onClick={() => downloadPdf("open")}> 
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir
              </Button>
            </div>
          )}

          {!notaFiscal.link_nf && notaFiscal.status_emissao === "pendente" && (
            <p className="text-sm text-muted-foreground text-center py-2">
              A nota fiscal está sendo processada. O link estará disponível em breve.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
