import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, User, Stethoscope, DollarSign, CreditCard, FileText, Phone, Mail, Pencil, Save, X, Receipt, Loader2 } from "lucide-react";
import { useUpdatePagamento } from "@/hooks/useFinanceiro";
import { useEmitirNFSe, useNotaFiscalByPagamento } from "@/hooks/useEmitirNFSe";
import { useCertificado } from "@/hooks/useCertificado";
import { useClinica } from "@/hooks/useClinica";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { VisualizarNFModal } from "./VisualizarNFModal";

interface ServicoAdicional {
  nome: string;
  valor?: number;
  preco?: number;
}

interface DetalhesAgendamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagamento: any;
}

export function DetalhesAgendamentoModal({ open, onOpenChange, pagamento }: DetalhesAgendamentoModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<string>('');
  const [dataVencimento, setDataVencimento] = useState<Date | undefined>(undefined);
  const [parcelasTotais, setParcelasTotais] = useState<number>(1);
  const [pagamentoAtual, setPagamentoAtual] = useState<any>(pagamento);
  const [notaFiscalLocal, setNotaFiscalLocal] = useState<any | null>(null);
  const [showNFModal, setShowNFModal] = useState(false);
  const navigate = useNavigate();
  const updatePagamento = useUpdatePagamento();
  const emitirNFSe = useEmitirNFSe();
  const { data: notaFiscalRemote, isLoading: nfLoading, refetch: refetchNotaFiscal } = useNotaFiscalByPagamento(pagamentoAtual?.id);
  const { certificate } = useCertificado();
  const { data: clinica } = useClinica();

  // Verifica se as configurações de NF estão completas
  const isNFConfigured = Boolean(
    clinica?.nf_cidade_emissao &&
    clinica?.nf_inscricao_municipal &&
    clinica?.nf_codigo_servico
  );
  const isCertificateActive = certificate?.status === 'active';
  const canEmitNF = isNFConfigured && isCertificateActive;

  const notaFiscal = notaFiscalLocal ?? notaFiscalRemote;

  useEffect(() => {
    if (pagamento) {
      setPagamentoAtual(pagamento);
      setNotaFiscalLocal(null);
      setIsEditing(false);
      setFormaPagamento('');
      setDataVencimento(undefined);
      setParcelasTotais(1);
    }
  }, [pagamento?.id]);

  if (!pagamento || !pagamentoAtual) return null;

  const agendamento = pagamentoAtual.agendamentos;
  const paciente = agendamento?.pacientes;
  const profissional = agendamento?.profissionais;
  const servicosAdicionais = agendamento?.servicos_adicionais as ServicoAdicional[] | null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    if (minutes === '00') {
      return `${hours}h`;
    }
    return `${hours}h${minutes}`;
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Não informado';
    return `${formatDate(dateString)} às ${formatTime(dateString)}`;
  };

  const getStatusAgendamento = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pendente: { label: 'Pendente', variant: 'secondary' },
      confirmado: { label: 'Confirmado', variant: 'default' },
      realizado: { label: 'Realizado', variant: 'default' },
      falta: { label: 'Falta', variant: 'destructive' },
    };
    return statusMap[status] || { label: status, variant: 'secondary' };
  };

  const getStatusPagamento = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pendente: { label: 'Pendente', variant: 'secondary' },
      pago: { label: 'Pago', variant: 'default' },
      vencido: { label: 'Vencido', variant: 'destructive' },
    };
    return statusMap[status] || { label: status, variant: 'secondary' };
  };

  const getFormaPagamentoLabel = (forma: string) => {
    const formas: Record<string, string> = {
      pix: 'PIX',
      cartao: 'Cartão',
      cartao_credito: 'Cartão de Crédito',
      cartao_debito: 'Cartão de Débito',
      dinheiro: 'Dinheiro',
      link: 'Link de Pagamento',
    };
    return formas[forma] || forma;
  };

  const valorServicoPrincipal = Number(pagamentoAtual.valor_total) - (
    Array.isArray(servicosAdicionais)
      ? servicosAdicionais.reduce((acc, s) => acc + Number(s.valor ?? s.preco ?? 0), 0)
      : 0
  );

  const handleStartEdit = () => {
    setFormaPagamento(pagamentoAtual.forma_pagamento || 'pix');
    setDataVencimento(pagamentoAtual.data_vencimento ? new Date(pagamentoAtual.data_vencimento) : undefined);
    setParcelasTotais(pagamentoAtual.parcelas_totais || 1);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormaPagamento('');
    setDataVencimento(undefined);
    setParcelasTotais(1);
  };

  const handleSave = async () => {
    try {
      const updated = await updatePagamento.mutateAsync({
        id: pagamentoAtual.id,
        data: {
          forma_pagamento: formaPagamento as any,
          data_vencimento: dataVencimento?.toISOString() || null,
          parcelas_totais: parcelasTotais,
          parcelado: parcelasTotais > 1,
        },
      });

      // Atualizar a visão do modal imediatamente (mantendo dados de agendamento)
      setPagamentoAtual((prev: any) => ({
        ...prev,
        ...updated,
        agendamentos: prev?.agendamentos,
      }));

      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
    }
  };

  const handleEmitirNF = async () => {
    if (!pagamentoAtual?.id) return;

    // Validar configurações antes de emitir
    if (!isCertificateActive) {
      toast.error('Certificado digital não configurado', {
        description: 'Configure seu certificado A1 antes de emitir notas fiscais.',
        action: {
          label: 'Configurar',
          onClick: () => navigate('/app/configuracoes?tab=clinica&section=certificado'),
        },
      });
      return;
    }

    if (!isNFConfigured) {
      toast.error('Configurações de NF incompletas', {
        description: 'Preencha os dados fiscais (cidade, inscrição municipal, código do serviço).',
        action: {
          label: 'Configurar',
          onClick: () => navigate('/app/configuracoes?tab=clinica&section=nf'),
        },
      });
      return;
    }

    try {
      const result = await emitirNFSe.mutateAsync(pagamentoAtual.id);
      if ((result as any)?.nota_fiscal) {
        setNotaFiscalLocal((result as any).nota_fiscal);
      }
      // Atualiza a nota fiscal após emissão bem-sucedida
      refetchNotaFiscal();
    } catch {
      // o toast já é mostrado no onError do hook; evitar unhandled rejection
    }
  };

  const getStatusNFLabel = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      emitida: { label: 'Emitida', variant: 'default' },
      pendente: { label: 'Processando', variant: 'secondary' },
      erro: { label: 'Erro', variant: 'destructive' },
    };
    return statusMap[status] || { label: status, variant: 'secondary' };
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Agendamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Paciente */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Paciente
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-medium text-lg">{paciente?.nome || 'Não informado'}</p>
              {paciente?.telefone && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  {paciente.telefone}
                </p>
              )}
              {paciente?.email && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {paciente.email}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Agendamento */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Agendamento
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Data e Hora</p>
                <p className="font-medium">{formatDateTime(agendamento?.data_inicio)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={getStatusAgendamento(agendamento?.status).variant} className="mt-1">
                  {getStatusAgendamento(agendamento?.status).label}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Profissional */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Profissional
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="font-medium">{profissional?.nome || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CRM/CRO</p>
                <p className="font-medium">{profissional?.crm_cro || 'Não informado'}</p>
              </div>
              {profissional?.especialidade && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Especialidade</p>
                  <p className="font-medium">{profissional.especialidade}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Serviços */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Serviços
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>{agendamento?.tipo_servico || 'Serviço principal'}</span>
                <span className="font-medium">R$ {formatCurrency(valorServicoPrincipal)}</span>
              </div>
              {Array.isArray(servicosAdicionais) && servicosAdicionais.length > 0 && (
                <>
                  {servicosAdicionais.map((servico, index) => (
                    <div key={index} className="flex justify-between text-muted-foreground">
                      <span>+ {servico.nome}</span>
                      <span>R$ {formatCurrency(Number(servico.valor ?? servico.preco ?? 0))}</span>
                    </div>
                  ))}
                </>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                 <span>R$ {formatCurrency(Number(pagamentoAtual.valor_total))}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pagamento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pagamento
              </h3>
              {!isEditing && pagamento.status !== 'pago' && (
                <Button variant="ghost" size="sm" onClick={handleStartEdit}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Forma de Pagamento</p>
                {isEditing ? (
                  <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="link">Link de Pagamento</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium">{getFormaPagamentoLabel(pagamentoAtual.forma_pagamento)}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                 <Badge variant={getStatusPagamento(pagamentoAtual.status).variant} className="mt-1">
                   {getStatusPagamento(pagamentoAtual.status).label}
                 </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Pago</p>
                 <p className="font-medium">R$ {formatCurrency(Number(pagamentoAtual.valor_pago || 0))}</p>
               </div>
               {pagamentoAtual.data_pagamento && (
                 <div>
                   <p className="text-xs text-muted-foreground">Data do Pagamento</p>
                   <p className="font-medium">{formatDate(pagamentoAtual.data_pagamento)}</p>
                 </div>
               )}
              <div>
                <p className="text-xs text-muted-foreground">Vencimento</p>
                {isEditing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !dataVencimento && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dataVencimento ? format(dataVencimento, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dataVencimento}
                        onSelect={setDataVencimento}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <p className="font-medium">{pagamentoAtual.data_vencimento ? formatDate(pagamentoAtual.data_vencimento) : 'Não informado'}</p>
                )}
              </div>
              {/* Parcelas - só mostra quando é cartão de crédito ou se já está parcelado */}
              {(isEditing ? formaPagamento === 'cartao_credito' : pagamentoAtual.parcelas_totais > 1 || pagamentoAtual.forma_pagamento === 'cartao_credito') && (
                <div>
                  <p className="text-xs text-muted-foreground">Parcelas</p>
                  {isEditing && formaPagamento === 'cartao_credito' ? (
                    <Select 
                      value={String(parcelasTotais)} 
                      onValueChange={(value) => setParcelasTotais(parseInt(value))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={String(num)}>
                            {num}x {Number(pagamentoAtual.valor_total) ? `de R$ ${formatCurrency(Number(pagamentoAtual.valor_total) / num)}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">
                      {pagamentoAtual.parcelas_totais > 1
                        ? ((pagamentoAtual.parcelas_recebidas || 0) > 0
                            ? `${pagamentoAtual.parcelas_recebidas}/${pagamentoAtual.parcelas_totais}x`
                            : `${pagamentoAtual.parcelas_totais}x`)
                        : 'À vista'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updatePagamento.isPending}>
                  <Save className="h-4 w-4 mr-1" />
                  {updatePagamento.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Nota Fiscal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Nota Fiscal
            </h3>
            
            {nfLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : notaFiscal && notaFiscal.status_emissao !== 'erro' ? (
              // NF existe e não está com erro - mostrar botão "Ver NF"
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setShowNFModal(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Nota Fiscal
                {notaFiscal.numero_nf && (
                  <span className="ml-2 text-muted-foreground">#{notaFiscal.numero_nf}</span>
                )}
              </Button>
            ) : notaFiscal?.status_emissao === 'erro' ? (
              // NF com erro - permitir reemitir
              <div className="space-y-2">
                <Badge variant="destructive" className="w-fit">Erro na emissão</Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleEmitirNF}
                  disabled={emitirNFSe.isPending}
                >
                  {emitirNFSe.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Receipt className="h-4 w-4 mr-2" />
                      Tentar Novamente
                    </>
                  )}
                </Button>
              </div>
            ) : (
              // Sem NF - mostrar botão de emitir
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleEmitirNF}
                disabled={emitirNFSe.isPending}
              >
                {emitirNFSe.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4 mr-2" />
                    Emitir Nota Fiscal
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <VisualizarNFModal 
      open={showNFModal} 
      onOpenChange={setShowNFModal} 
      notaFiscal={notaFiscal} 
    />
  </>
  );
}
