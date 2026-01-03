import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FileKey, Upload, RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle, HelpCircle } from 'lucide-react';
import { useCertificado } from '@/hooks/useCertificado';
import { CertificadoUploadModal } from './CertificadoUploadModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function CertificadoDigitalCard() {
  const { certificate, isLoading, getStatusLabel, getStatusColor, refreshCertificate } = useCertificado();
  const [modalOpen, setModalOpen] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  const handleOpenModal = (replacing: boolean = false) => {
    setIsReplacing(replacing);
    setModalOpen(true);
  };

  const status = certificate?.status || 'not_configured';
  const statusLabel = getStatusLabel(status);
  const statusColor = getStatusColor(status);

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'validating':
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 'expiring_soon':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'invalid':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileKey className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card id="config-certificado">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileKey className="h-5 w-5" />
              <CardTitle className="text-lg">Certificado Digital (A1)</CardTitle>
            </div>
            <Badge variant="outline" className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${statusColor}`} />
              {statusLabel}
            </Badge>
          </div>
          <CardDescription>
            Necessário para emissão automática de NFS-e
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status-specific content */}
          {status === 'not_configured' && (
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>
                Configure seu certificado A1 para emitir notas fiscais automaticamente.
              </AlertDescription>
            </Alert>
          )}

          {status === 'active' && certificate?.valid_until && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getStatusIcon()}
              <span>
                Válido até {format(new Date(certificate.valid_until), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          )}

          {status === 'expiring_soon' && certificate?.valid_until && (
            <Alert variant="destructive" className="border-orange-500 bg-orange-500/10">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-700 dark:text-orange-300">
                Seu certificado vence em {format(new Date(certificate.valid_until), "dd/MM/yyyy", { locale: ptBR })}.
                Substitua antes do vencimento para não interromper a emissão de NFS-e.
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && certificate?.last_error_message && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{certificate.last_error_message}</AlertDescription>
            </Alert>
          )}

          {status === 'invalid' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {certificate?.last_error_message || 'Certificado inválido ou expirado. Envie um novo certificado A1.'}
              </AlertDescription>
            </Alert>
          )}

          {status === 'validating' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getStatusIcon()}
              <span>Validando certificado com o provedor fiscal...</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {status === 'not_configured' || status === 'invalid' || status === 'error' ? (
              <Button onClick={() => handleOpenModal(false)} className="flex-1">
                <Upload className="mr-2 h-4 w-4" />
                Enviar certificado
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => handleOpenModal(true)} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Substituir certificado
                </Button>
                <Button variant="ghost" size="icon" onClick={refreshCertificate} title="Atualizar status">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* FAQ */}
          <Accordion type="single" collapsible className="pt-2">
            <AccordionItem value="faq" className="border-none">
              <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline py-2">
                <span className="flex items-center gap-1">
                  <HelpCircle className="h-4 w-4" />
                  Como obter meu certificado A1?
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>1. Escolha uma certificadora:</strong> Serasa, Certisign, SafeWeb, etc.
                </p>
                <p>
                  <strong>2. Solicite um Certificado A1 (e-CNPJ ou e-CPF):</strong> É o tipo de certificado em arquivo.
                </p>
                <p>
                  <strong>3. Complete a validação:</strong> Geralmente online ou presencial.
                </p>
                <p>
                  <strong>4. Faça o download:</strong> Você receberá um arquivo .pfx ou .p12 com uma senha.
                </p>
                <p className="pt-2 text-xs">
                  💡 Dica: O certificado A1 tem validade de 1 ano. Guarde a senha em local seguro.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <CertificadoUploadModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        isReplacing={isReplacing}
        onUploaded={refreshCertificate}
      />
    </>
  );
}
