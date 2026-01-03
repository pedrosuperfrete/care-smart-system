import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado', code: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido', code: 'invalid_token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profissional, error: profError } = await supabase
      .from('profissionais')
      .select('id')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .maybeSingle();

    if (profError) {
      console.error('certificate-sync: error fetching profissional:', profError);
      return new Response(JSON.stringify({ error: 'Erro ao localizar profissional', code: 'db_error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!profissional?.id) {
      return new Response(JSON.stringify({ error: 'Profissional não encontrado', code: 'not_found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const profissional_id = profissional.id as string;

    const { data: lastSuccess, error: logError } = await supabase
      .from('certificate_audit_logs')
      .select('metadata, created_at')
      .eq('profissional_id', profissional_id)
      .eq('action', 'CERT_UPLOAD_SUCCESS')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (logError) {
      console.error('certificate-sync: error fetching audit log:', logError);
      return new Response(JSON.stringify({ error: 'Erro ao buscar histórico do certificado', code: 'db_error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!lastSuccess?.metadata) {
      return new Response(JSON.stringify({ success: true, updated: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const metadata = lastSuccess.metadata as Record<string, unknown>;
    const plugnotas_certificate_id = (metadata.plugnotas_certificate_id as string | undefined) ?? null;
    const status = (metadata.status as string | undefined) ?? 'active';
    const valid_until = (metadata.valid_until as string | undefined) ?? null;

    const { error: updateError } = await supabase
      .from('certificates')
      .update({
        plugnotas_certificate_id,
        status,
        valid_until,
        last_error_code: null,
        last_error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('profissional_id', profissional_id);

    if (updateError) {
      console.error('certificate-sync: error updating certificate:', updateError);
      return new Response(JSON.stringify({ error: 'Erro ao atualizar certificado', code: 'db_error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: true,
        status,
        plugnotas_certificate_id,
        valid_until,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('certificate-sync: unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Erro inesperado', code: 'unknown_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
