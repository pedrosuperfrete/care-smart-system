import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Usar sandbox ou produção baseado na env
const USE_PRODUCTION = Deno.env.get('USE_PLUGNOTAS_PROD') === 'true';
const PLUGNOTAS_API_KEY = USE_PRODUCTION 
  ? Deno.env.get('PLUGNOTAS_PROD_API_KEY')
  : Deno.env.get('PLUGNOTAS_SANDBOX_API_KEY');
const PLUGNOTAS_BASE_URL = USE_PRODUCTION
  ? 'https://api.plugnotas.com.br'
  : 'https://api.sandbox.plugnotas.com.br';

interface StatusNFSeRequest {
  nota_fiscal_id?: string;
  pagamento_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Autenticação do usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: StatusNFSeRequest = await req.json();
    const { nota_fiscal_id, pagamento_id } = body;

    if (!nota_fiscal_id && !pagamento_id) {
      return new Response(
        JSON.stringify({ error: 'nota_fiscal_id ou pagamento_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Consultando status da NF:', { nota_fiscal_id, pagamento_id });

    // Buscar nota fiscal no banco
    let query = supabase.from('notas_fiscais').select('*');
    
    if (nota_fiscal_id) {
      query = query.eq('id', nota_fiscal_id);
    } else if (pagamento_id) {
      query = query.eq('pagamento_id', pagamento_id);
    }

    const { data: notaFiscal, error: nfError } = await query.maybeSingle();

    if (nfError || !notaFiscal) {
      console.error('Nota fiscal não encontrada:', nfError);
      return new Response(
        JSON.stringify({ error: 'Nota fiscal não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se já está emitida, retornar dados atuais
    if (notaFiscal.status_emissao === 'emitida' && notaFiscal.link_nf) {
      console.log('NF já emitida, retornando dados existentes');
      return new Response(
        JSON.stringify({
          success: true,
          status: 'emitida',
          nota_fiscal: notaFiscal,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se status é erro, retornar como está
    if (notaFiscal.status_emissao === 'erro') {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'erro',
          nota_fiscal: notaFiscal,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar API key
    if (!PLUGNOTAS_API_KEY) {
      console.error('API key do PlugNotas não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração de integração com NF-e incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Consultar status no PlugNotas usando o numero_nf (que é o ID do PlugNotas)
    const plugnotasId = notaFiscal.numero_nf;
    if (!plugnotasId) {
      return new Response(
        JSON.stringify({
          success: true,
          status: 'pendente',
          message: 'NF ainda não possui ID do PlugNotas',
          nota_fiscal: notaFiscal,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Consultando PlugNotas ID:', plugnotasId);

    const plugnotasResponse = await fetch(`${PLUGNOTAS_BASE_URL}/nfse/${plugnotasId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': PLUGNOTAS_API_KEY,
      },
    });

    if (!plugnotasResponse.ok) {
      console.error('Erro ao consultar PlugNotas:', plugnotasResponse.status);
      return new Response(
        JSON.stringify({
          success: true,
          status: 'pendente',
          message: 'Não foi possível consultar status no PlugNotas',
          nota_fiscal: notaFiscal,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const plugnotasResult = await plugnotasResponse.json();
    console.log('Resposta PlugNotas status:', JSON.stringify(plugnotasResult, null, 2));

    // Verificar status da NF no PlugNotas
    // Status possíveis: AGUARDANDO, PROCESSANDO, CONCLUIDO, ERRO, REJEITADO
    const statusPlugnotas = plugnotasResult?.status || plugnotasResult?.situacao;
    const numeroNfse = plugnotasResult?.numeroNfse || plugnotasResult?.numero;
    const linkPdf = plugnotasResult?.pdf || plugnotasResult?.linkPdf || plugnotasResult?.url?.pdf;
    const linkXml = plugnotasResult?.xml || plugnotasResult?.linkXml || plugnotasResult?.url?.xml;

    console.log('Status PlugNotas:', statusPlugnotas, 'Numero:', numeroNfse, 'PDF:', linkPdf);

    // Mapear status do PlugNotas para nosso status
    let novoStatus: 'emitida' | 'pendente' | 'erro' = 'pendente';
    
    if (statusPlugnotas === 'CONCLUIDO' || statusPlugnotas === 'AUTORIZADO' || statusPlugnotas === 'EMITIDA') {
      novoStatus = 'emitida';
    } else if (statusPlugnotas === 'ERRO' || statusPlugnotas === 'REJEITADO' || statusPlugnotas === 'CANCELADO') {
      novoStatus = 'erro';
    }

    // Se mudou de status, atualizar no banco
    if (novoStatus !== notaFiscal.status_emissao || (novoStatus === 'emitida' && linkPdf && !notaFiscal.link_nf)) {
      console.log('Atualizando status da NF de', notaFiscal.status_emissao, 'para', novoStatus);
      
      const updateData: any = {
        status_emissao: novoStatus,
      };

      if (numeroNfse) {
        updateData.numero_nf = String(numeroNfse);
      }

      if (linkPdf) {
        updateData.link_nf = linkPdf;
      }

      const { data: nfAtualizada, error: updateError } = await supabase
        .from('notas_fiscais')
        .update(updateData)
        .eq('id', notaFiscal.id)
        .select()
        .single();

      if (updateError) {
        console.error('Erro ao atualizar nota fiscal:', updateError);
      } else {
        console.log('NF atualizada com sucesso:', nfAtualizada);
        return new Response(
          JSON.stringify({
            success: true,
            status: novoStatus,
            updated: true,
            nota_fiscal: nfAtualizada,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: novoStatus,
        updated: false,
        nota_fiscal: notaFiscal,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao consultar status da NF:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao consultar status da NF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
