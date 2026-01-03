import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type CertificateStatus = 'not_configured' | 'validating' | 'active' | 'expiring_soon' | 'invalid' | 'error';

interface Certificate {
  id: string;
  profissional_id: string;
  cnpj: string;
  plugnotas_certificate_id: string | null;
  status: CertificateStatus;
  valid_until: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface UploadResult {
  success: boolean;
  status?: CertificateStatus;
  valid_until?: string;
  error?: string;
  code?: string;
}

const CONSENT_TEXT = 'Eu autorizo o Donne a usar este certificado digital exclusivamente para emitir NFS-e em meu nome, conforme minha configuração fiscal.';

export function useCertificado() {
  const { profissional } = useAuth();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificate = useCallback(async () => {
    if (!profissional?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('profissional_id', profissional.id)
        .maybeSingle();

      if (error) throw error;
      
      // Cast the status to our expected type
      if (data) {
        setCertificate({
          ...data,
          status: data.status as CertificateStatus
        });
      } else {
        setCertificate(null);
      }
    } catch (err) {
      console.error('Error fetching certificate:', err);
      setError('Erro ao carregar status do certificado');
    } finally {
      setIsLoading(false);
    }
  }, [profissional?.id]);

  useEffect(() => {
    fetchCertificate();
  }, [fetchCertificate]);

  const uploadCertificate = async (
    file: File,
    password: string,
    cnpj: string,
    useProduction: boolean = false
  ): Promise<UploadResult> => {
    if (!profissional?.id) {
      return { success: false, error: 'Profissional não encontrado' };
    }

    setIsUploading(true);
    setError(null);

    try {
      // Get current session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);
      formData.append('metadata', JSON.stringify({
        profissional_id: profissional.id,
        cnpj,
        consent_accepted: true,
        consent_text: CONSENT_TEXT,
        use_production: useProduction,
      }));

      // Call edge function
      const response = await fetch(
        `https://zxgkspeehamsrfhynbzr.supabase.co/functions/v1/certificate-upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Erro ao enviar certificado');
        return { success: false, error: result.error, code: result.code };
      }

      // Refresh certificate data
      await fetchCertificate();

      return {
        success: true,
        status: result.status,
        valid_until: result.valid_until,
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Erro inesperado ao enviar certificado';
      setError(errorMessage);
      console.error('Upload error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusLabel = (status: CertificateStatus | undefined): string => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'validating':
        return 'Validando...';
      case 'expiring_soon':
        return 'Vencendo em breve';
      case 'invalid':
        return 'Inválido';
      case 'error':
        return 'Erro';
      case 'not_configured':
      default:
        return 'Não configurado';
    }
  };

  const getStatusColor = (status: CertificateStatus | undefined): string => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'validating':
        return 'bg-yellow-500';
      case 'expiring_soon':
        return 'bg-orange-500';
      case 'invalid':
      case 'error':
        return 'bg-red-500';
      case 'not_configured':
      default:
        return 'bg-gray-400';
    }
  };

  return {
    certificate,
    isLoading,
    isUploading,
    error,
    uploadCertificate,
    refreshCertificate: fetchCertificate,
    getStatusLabel,
    getStatusColor,
    consentText: CONSENT_TEXT,
  };
}
