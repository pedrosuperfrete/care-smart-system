import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Eye, EyeOff, FileKey, AlertCircle, CheckCircle } from 'lucide-react';
import { useCertificado } from '@/hooks/useCertificado';
import { useClinica } from '@/hooks/useClinica';
import { toast } from 'sonner';

interface CertificadoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isReplacing?: boolean;
  onUploaded?: () => void;
}

export function CertificadoUploadModal({
  open,
  onOpenChange,
  isReplacing = false,
  onUploaded,
}: CertificadoUploadModalProps) {
  const { uploadCertificate, isUploading, consentText } = useCertificado();
  const { data: clinica } = useClinica();
  
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      if (!fileName.endsWith('.pfx') && !fileName.endsWith('.p12')) {
        setError('Arquivo inválido. Selecione um certificado A1 (.pfx ou .p12)');
        setFile(null);
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Arquivo muito grande. Máximo 5MB.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !password || !consentAccepted) {
      setError('Preencha todos os campos e aceite o termo de consentimento.');
      return;
    }

    const cnpj = clinica?.cnpj;
    if (!cnpj) {
      setError('CNPJ da clínica não encontrado. Configure o CNPJ primeiro.');
      return;
    }

    setError(null);
    
    const result = await uploadCertificate(file, password, cnpj, false); // false = sandbox
    
    if (result.success) {
      setSuccess(true);
      toast.success('Certificado conectado com sucesso!');

      // Mantém o card sincronizado (o modal tem seu próprio hook/estado)
      try {
        await onUploaded?.();
      } catch {
        // noop
      }

      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 2000);
    } else {
      setError(result.error || 'Erro ao enviar certificado');
    }
  };

  const resetForm = () => {
    setFile(null);
    setPassword('');
    setConsentAccepted(false);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileKey className="h-5 w-5" />
            {isReplacing ? 'Substituir Certificado A1' : 'Enviar Certificado A1'}
          </DialogTitle>
          <DialogDescription>
            Envie seu certificado digital A1 para emissão de NFS-e. 
            O certificado é enviado diretamente ao provedor fiscal e nunca é armazenado no Donne.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">Certificado conectado com sucesso!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Você já pode emitir notas fiscais.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Educational text */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>O que é o Certificado A1?</strong>
                <br />
                É sua identidade digital para emitir notas fiscais. Aceita apenas arquivos .pfx ou .p12.
                <br />
                <span className="text-muted-foreground text-xs mt-1 block">
                  Isso NÃO dá acesso à sua conta bancária ou outros sistemas.
                </span>
              </AlertDescription>
            </Alert>

            {/* File input */}
            <div className="space-y-2">
              <Label htmlFor="certificate-file">Arquivo do Certificado</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="certificate-file"
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
              {file && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <Label htmlFor="certificate-password">Senha do Certificado</Label>
              <div className="relative">
                <Input
                  id="certificate-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha do certificado"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Consent checkbox */}
            <div className="flex items-start gap-3 p-3 border rounded-lg bg-muted/50">
              <Checkbox
                id="consent"
                checked={consentAccepted}
                onCheckedChange={(checked) => setConsentAccepted(checked === true)}
              />
              <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                {consentText}
              </Label>
            </div>

            {/* Error display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Security note */}
            <p className="text-xs text-muted-foreground text-center">
              🔒 Nunca armazenamos seu certificado. Ele é enviado de forma segura ao provedor fiscal.
            </p>

            {/* Submit button */}
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!file || !password || !consentAccepted || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Validar e conectar
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
