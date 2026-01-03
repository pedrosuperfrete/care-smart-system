import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Error message mapping
const ERROR_MESSAGES: Record<string, string> = {
  password_invalid: 'Senha incorreta. Verifique a senha do certificado A1 e tente novamente.',
  file_invalid: 'Arquivo inválido. Envie um certificado A1 (.pfx ou .p12).',
  cert_expired: 'Seu certificado está expirado. Gere/renove um novo A1 e envie novamente.',
  no_private_key: 'Este certificado não contém a chave privada. Confirme se você exportou como A1 (.pfx/.p12) com chave privada.',
  plugnotas_unauthorized: 'Falha de autenticação com a PlugNotas. Verifique a API Key (sandbox/produção) configurada no Supabase.',
  plugnotas_unavailable: 'Serviço fiscal indisponível no momento. Tente novamente em alguns minutos.',
  rate_limited: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
  unknown_error: 'Não foi possível validar seu certificado. Tente novamente. Se persistir, fale com o suporte.',
};

// Rate limit configuration
const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

interface UploadRequest {
  profissional_id: string;
  cnpj: string;
  consent_accepted: boolean;
  consent_text: string;
  use_production?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado', code: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido', code: 'invalid_token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const password = formData.get('password') as string | null;
    const metadataStr = formData.get('metadata') as string | null;

    if (!file || !password || !metadataStr) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos', code: 'missing_data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let metadata: UploadRequest;
    try {
      metadata = JSON.parse(metadataStr);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Metadados inválidos', code: 'invalid_metadata' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { profissional_id, cnpj, consent_accepted, consent_text, use_production } = metadata;

    // Validate consent
    if (!consent_accepted) {
      return new Response(
        JSON.stringify({ error: 'Consentimento obrigatório', code: 'consent_required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pfx') && !fileName.endsWith('.p12')) {
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.file_invalid, code: 'file_invalid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Arquivo muito grande. Máximo 5MB.', code: 'file_too_large' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    
    const { data: rateLimit, error: rateLimitError } = await supabase
      .from('certificate_rate_limits')
      .select('*')
      .eq('profissional_id', profissional_id)
      .gte('window_start', windowStart)
      .maybeSingle();

    if (rateLimit && rateLimit.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
      console.log(`Rate limit exceeded for profissional_id: ${profissional_id}`);
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.rate_limited, code: 'rate_limited' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update or create rate limit entry
    if (rateLimit) {
      await supabase
        .from('certificate_rate_limits')
        .update({ attempts: rateLimit.attempts + 1, updated_at: new Date().toISOString() })
        .eq('id', rateLimit.id);
    } else {
      await supabase
        .from('certificate_rate_limits')
        .insert({ profissional_id, attempts: 1, window_start: new Date().toISOString() });
    }

    // Create audit log for attempt (NEVER log password or file content)
    await supabase.from('certificate_audit_logs').insert({
      profissional_id,
      action: 'CERT_UPLOAD_ATTEMPT',
      metadata: {
        file_extension: fileName.split('.').pop(),
        file_size_bytes: file.size,
        cnpj_masked: cnpj.slice(0, 4) + '****' + cnpj.slice(-4),
      },
    });

    // Update certificate status to validating (capture row id for later updates)
    let certificateRowId: string | null = null;

    const { data: existingCert, error: existingCertError } = await supabase
      .from('certificates')
      .select('id')
      .eq('profissional_id', profissional_id)
      .maybeSingle();

    if (existingCertError) {
      console.error('Error checking existing certificate:', existingCertError);
    }

    if (existingCert?.id) {
      certificateRowId = existingCert.id;
      const { error: setValidatingError } = await supabase
        .from('certificates')
        .update({ status: 'validating', updated_at: new Date().toISOString() })
        .eq('id', existingCert.id);

      if (setValidatingError) {
        console.error('Error setting certificate status to validating:', setValidatingError);
      }
    } else {
      const { data: insertedCert, error: insertCertError } = await supabase
        .from('certificates')
        .insert({
          profissional_id,
          cnpj,
          status: 'validating',
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertCertError) {
        console.error('Error inserting certificate:', insertCertError);
      } else {
        certificateRowId = insertedCert?.id ?? null;
      }
    }

    if (!certificateRowId) {
      // Without a row id we can’t reliably persist status updates.
      await logFailure(supabase, profissional_id, 'db_error');
      return new Response(
        JSON.stringify({ error: 'Erro interno ao salvar certificado. Tente novamente.', code: 'db_error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record consent
    await supabase.from('certificate_consents').insert({
      profissional_id,
      consent_text,
      consent_text_version: 'v1',
      consent_ip: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || null,
    });

    // Prepare file for PlugNotas API
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    // Select API key based on environment
    const plugnotasApiKey = use_production 
      ? Deno.env.get('PLUGNOTAS_PROD_API_KEY')
      : Deno.env.get('PLUGNOTAS_SANDBOX_API_KEY');

    if (!plugnotasApiKey) {
      console.error('PlugNotas API key not configured');
      await updateCertificateError(supabase, profissional_id, 'config_error', 'Chave de API não configurada');
      await logFailure(supabase, profissional_id, 'config_error');
      return new Response(
        JSON.stringify({ error: 'Configuração do serviço fiscal incompleta', code: 'config_error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send to PlugNotas API
    const plugnotasFormData = new FormData();
    plugnotasFormData.append('arquivo', new Blob([fileBytes], { type: 'application/x-pkcs12' }), file.name);
    plugnotasFormData.append('senha', password);

    // Select correct PlugNotas base URL based on environment
    const plugnotasBaseUrl = use_production 
      ? 'https://api.plugnotas.com.br'
      : 'https://api.sandbox.plugnotas.com.br';

    console.log(`Sending certificate to PlugNotas (${use_production ? 'production' : 'sandbox'}) for CNPJ: ${cnpj.slice(0, 4)}****`);

    let plugnotasResponse;
    try {
      // Ensure API key is properly trimmed and encoded as ASCII
      const cleanApiKey = plugnotasApiKey.trim().replace(/[^\x00-\x7F]/g, '');
      
      plugnotasResponse = await fetch(`${plugnotasBaseUrl}/certificado`, {
        method: 'POST',
        headers: {
          // Docs: "X-API-KEY: {{apiKey}}" (header name is case-insensitive, but we keep the canonical casing)
          'X-API-KEY': cleanApiKey,
          'Accept': 'application/json',
        },
        body: plugnotasFormData,
      });
    } catch (fetchError) {
      console.error('PlugNotas network error:', fetchError);
      await updateCertificateError(supabase, profissional_id, 'plugnotas_unavailable', ERROR_MESSAGES.plugnotas_unavailable);
      await logFailure(supabase, profissional_id, 'plugnotas_unavailable');
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.plugnotas_unavailable, code: 'plugnotas_unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseContentType = plugnotasResponse.headers.get('content-type') || '';
    const plugnotasBodyText = await plugnotasResponse.text();

    let plugnotasData: any = null;
    try {
      plugnotasData = plugnotasBodyText ? JSON.parse(plugnotasBodyText) : null;
    } catch {
      // Some PlugNotas errors may come back as non-JSON (HTML/plain text)
      plugnotasData = plugnotasBodyText;
    }

    console.log('PlugNotas response status:', plugnotasResponse.status);
    console.log('PlugNotas response content-type:', responseContentType);
    console.log('PlugNotas response body preview:', (plugnotasBodyText || '').slice(0, 200));

    if (!plugnotasResponse.ok) {
      // 401 is explicit in docs: "X-API-KEY ausente ou inválido"
      const errorCode = plugnotasResponse.status === 401
        ? 'plugnotas_unauthorized'
        : mapPlugNotasError(plugnotasData);

      const errorMessage = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.unknown_error;
      
      console.log(`PlugNotas error: ${errorCode}`);
      await updateCertificateError(supabase, profissional_id, errorCode, errorMessage);
      await logFailure(supabase, profissional_id, errorCode);
      
      return new Response(
        JSON.stringify({ error: errorMessage, code: errorCode }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Success - update certificate
    const plugnotasCertId = plugnotasData.id || plugnotasData.certificateId || plugnotasData.data?.id;
    const validUntil = plugnotasData.validUntil || plugnotasData.dataValidade || plugnotasData.data?.validade;

    // Determine if expiring soon (within 30 days)
    let status = 'active';
    if (validUntil) {
      const expiryDate = new Date(validUntil);
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      if (expiryDate <= thirtyDaysFromNow) {
        status = 'expiring_soon';
      }
    }

    const { error: updateSuccessError } = await supabase
      .from('certificates')
      .update({
        plugnotas_certificate_id: plugnotasCertId ?? null,
        status,
        valid_until: validUntil || null,
        last_error_code: null,
        last_error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', certificateRowId);

    if (updateSuccessError) {
      console.error('Error updating certificate after PlugNotas success:', updateSuccessError);
      await logFailure(supabase, profissional_id, 'db_error');
      return new Response(
        JSON.stringify({ error: 'Erro ao finalizar validação do certificado. Tente novamente.', code: 'db_error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log success
    await supabase.from('certificate_audit_logs').insert({
      profissional_id,
      action: 'CERT_UPLOAD_SUCCESS',
      metadata: {
        plugnotas_certificate_id: plugnotasCertId,
        valid_until: validUntil,
        status,
      },
    });

    // Reset rate limit on success
    await supabase
      .from('certificate_rate_limits')
      .delete()
      .eq('profissional_id', profissional_id);

    console.log(`Certificate uploaded successfully for profissional_id: ${profissional_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        status,
        valid_until: validUntil,
        plugnotas_certificate_id: plugnotasCertId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.unknown_error, code: 'unknown_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to map PlugNotas errors
function mapPlugNotasError(response: any): string {
  // Handle different response formats from PlugNotas
  // PlugNotas format: { "error": { "message": "...", "data": {...} } }
  let message = '';
  
  if (typeof response === 'string') {
    message = response.toLowerCase();
  } else if (response?.error?.message && typeof response.error.message === 'string') {
    // Primary format: { error: { message: "..." } }
    message = response.error.message.toLowerCase();
  } else if (response?.message && typeof response.message === 'string') {
    message = response.message.toLowerCase();
  } else if (response?.mensagem && typeof response.mensagem === 'string') {
    message = response.mensagem.toLowerCase();
  } else if (response?.error && typeof response.error === 'string') {
    message = response.error.toLowerCase();
  } else if (response?.errors && Array.isArray(response.errors)) {
    message = response.errors.map((e: any) => typeof e === 'string' ? e : e?.message || '').join(' ').toLowerCase();
  }
  
  console.log('PlugNotas error message parsed:', message);
  
  if (message.includes('senha') || message.includes('password') || message.includes('incorreta')) {
    return 'password_invalid';
  }
  if (message.includes('expirado') || message.includes('expired') || message.includes('validade')) {
    return 'cert_expired';
  }
  if (message.includes('chave privada') || message.includes('private key')) {
    return 'no_private_key';
  }
  if (message.includes('inválido') || message.includes('invalid') || message.includes('formato')) {
    return 'file_invalid';
  }
  if (message.includes('unauthorized') || message.includes('api key') || message.includes('não autorizado')) {
    return 'plugnotas_unavailable';
  }
  
  return 'unknown_error';
}

// Helper to update certificate with error
async function updateCertificateError(
  supabase: any,
  profissionalId: string,
  errorCode: string,
  errorMessage: string
) {
  await supabase
    .from('certificates')
    .update({
      status: errorCode === 'cert_expired' ? 'invalid' : 'error',
      last_error_code: errorCode,
      last_error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('profissional_id', profissionalId);
}

// Helper to log failure
async function logFailure(supabase: any, profissionalId: string, errorCode: string) {
  await supabase.from('certificate_audit_logs').insert({
    profissional_id: profissionalId,
    action: 'CERT_UPLOAD_FAILURE',
    metadata: { error_code: errorCode },
  });
}
