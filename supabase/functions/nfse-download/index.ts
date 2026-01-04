import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const USE_PRODUCTION = Deno.env.get('USE_PLUGNOTAS_PROD') === 'true';
const PLUGNOTAS_API_KEY = USE_PRODUCTION
  ? Deno.env.get('PLUGNOTAS_PROD_API_KEY')
  : Deno.env.get('PLUGNOTAS_SANDBOX_API_KEY');

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

interface DownloadNFSeRequest {
  nota_fiscal_id?: string;
}

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
      return new Response(JSON.stringify({ error: 'Token de autorização não fornecido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      console.error('Erro de autenticação:', authError);
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: DownloadNFSeRequest = await req.json().catch(() => ({}));
    const notaFiscalId = String(body?.nota_fiscal_id ?? '').trim();

    if (!notaFiscalId || !isUuid(notaFiscalId)) {
      return new Response(JSON.stringify({ error: 'ID da nota fiscal inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!PLUGNOTAS_API_KEY) {
      console.error('API key do PlugNotas não configurada');
      return new Response(JSON.stringify({ error: 'Configuração de integração com NF-e incompleta' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar nota fiscal
    const { data: nf, error: nfError } = await supabase
      .from('notas_fiscais')
      .select('id, pagamento_id, link_nf, numero_nf')
      .eq('id', notaFiscalId)
      .single();

    if (nfError || !nf) {
      console.error('Erro ao buscar nota fiscal:', nfError);
      return new Response(JSON.stringify({ error: 'Nota fiscal não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!nf.link_nf) {
      return new Response(JSON.stringify({ error: 'Link do PDF ainda não está disponível' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Autorizar acesso: a NF precisa pertencer a um profissional do usuário
    const { data: pagamento, error: pagamentoError } = await supabase
      .from('pagamentos')
      .select(
        `id,
         agendamentos!pagamentos_agendamento_id_fkey (
           profissionais ( user_id )
         )`
      )
      .eq('id', nf.pagamento_id)
      .single();

    if (pagamentoError || !pagamento) {
      console.error('Erro ao buscar pagamento da nota fiscal:', pagamentoError);
      return new Response(JSON.stringify({ error: 'Pagamento não encontrado para esta nota fiscal' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ownerUserId = (pagamento as any)?.agendamentos?.profissionais?.user_id as string | undefined;
    if (!ownerUserId || ownerUserId !== user.id) {
      return new Response(JSON.stringify({ error: 'Sem permissão para acessar esta nota fiscal' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Baixando PDF NFS-e via PlugNotas', {
      nota_fiscal_id: nf.id,
      pagamento_id: nf.pagamento_id,
      url: nf.link_nf,
      env: USE_PRODUCTION ? 'prod' : 'sandbox',
    });

    const pdfResponse = await fetch(nf.link_nf, {
      method: 'GET',
      headers: {
        'X-API-KEY': PLUGNOTAS_API_KEY,
      },
    });

    if (!pdfResponse.ok) {
      const text = await pdfResponse.text().catch(() => '');
      console.error('Erro ao baixar PDF no PlugNotas', {
        status: pdfResponse.status,
        body: text?.slice(0, 500),
      });
      return new Response(
        JSON.stringify({
          error: 'Não foi possível baixar o PDF da nota fiscal no PlugNotas',
          status: pdfResponse.status,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const buffer = await pdfResponse.arrayBuffer();
    const filename = `nfse-${(nf.numero_nf || nf.id).toString().replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`;

    return new Response(buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Erro ao baixar NFS-e:', error);
    return new Response(JSON.stringify({ error: 'Erro interno ao baixar a nota fiscal' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
