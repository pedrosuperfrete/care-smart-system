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

const normalizeCnpj = (value: string) => (value ?? '').replace(/\D/g, '');

const isValidCnpj = (value: string) => {
  const cnpj = normalizeCnpj(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  const calcDigit = (base: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += Number(base[i]) * weights[i];
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const base12 = cnpj.slice(0, 12);
  const d1 = calcDigit(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const base13 = base12 + String(d1);
  const d2 = calcDigit(base13, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return cnpj === base13 + String(d2);
};

interface EmitirNFSeRequest {
  pagamento_id: string;
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

    const { pagamento_id }: EmitirNFSeRequest = await req.json();

    if (!pagamento_id) {
      return new Response(
        JSON.stringify({ error: 'ID do pagamento é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Iniciando emissão de NFS-e para pagamento:', pagamento_id);

    // Buscar dados do pagamento com agendamento, paciente e profissional
    // Especificando a FK para evitar ambiguidade (existem 2 FKs entre pagamentos e agendamentos)
    const { data: pagamento, error: pagamentoError } = await supabase
      .from('pagamentos')
      .select(`
        *,
        agendamentos!pagamentos_agendamento_id_fkey (
          *,
          pacientes (*),
          profissionais (*, clinica_id)
        )
      `)
      .eq('id', pagamento_id)
      .single();

    if (pagamentoError || !pagamento) {
      console.error('Erro ao buscar pagamento:', pagamentoError);
      return new Response(
        JSON.stringify({ error: 'Pagamento não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o pagamento está pago
    if (pagamento.status !== 'pago') {
      return new Response(
        JSON.stringify({ error: 'Só é possível emitir NF para pagamentos já confirmados' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já existe NF emitida
    const { data: nfExistente } = await supabase
      .from('notas_fiscais')
      .select('id, status_emissao, numero_nf, link_nf, data_emissao, valor_nf, pagamento_id, paciente_id')
      .eq('pagamento_id', pagamento_id)
      .maybeSingle();

    if (nfExistente && nfExistente.status_emissao === 'emitida') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nota fiscal já emitida para este pagamento',
          nfse_id: nfExistente.numero_nf,
          nota_fiscal: nfExistente,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const agendamento = pagamento.agendamentos;
    const paciente = agendamento?.pacientes;
    const profissional = agendamento?.profissionais;

    if (!profissional?.clinica_id) {
      return new Response(
        JSON.stringify({ error: 'Profissional sem clínica associada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados da clínica
    const { data: clinica, error: clinicaError } = await supabase
      .from('clinicas')
      .select('*')
      .eq('id', profissional.clinica_id)
      .single();

    if (clinicaError || !clinica) {
      console.error('Erro ao buscar clínica:', clinicaError);
      return new Response(
        JSON.stringify({ error: 'Clínica não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar configurações de NF
    const cnpjRaw = String(clinica.cnpj ?? '').trim();
    const cnpjDigits = normalizeCnpj(cnpjRaw);

    if (!cnpjRaw || cnpjRaw.startsWith('temp-') || !isValidCnpj(cnpjDigits)) {
      return new Response(
        JSON.stringify({
          error: 'CNPJ da clínica inválido. Informe um CNPJ válido (00.000.000/0000-00) em Configurações > Clínica > Nota Fiscal.',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!clinica.nf_inscricao_municipal) {
      return new Response(
        JSON.stringify({ error: 'Inscrição municipal não configurada. Acesse Configurações > Clínica > Nota Fiscal.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!clinica.nf_codigo_servico) {
      return new Response(
        JSON.stringify({ error: 'Código do serviço não configurado. Acesse Configurações > Clínica > Nota Fiscal.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se tem certificado digital ativo
    const { data: certificate } = await supabase
      .from('certificates')
      .select('status, plugnotas_certificate_id')
      .eq('profissional_id', profissional.id)
      .single();

    if (!certificate || certificate.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Certificado digital não configurado ou inválido. Acesse Configurações > Clínica > Certificado Digital.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Formatar CPF do paciente (remover pontuação)
    const cpfPaciente = paciente?.cpf?.replace(/\D/g, '') || '';
    if (!cpfPaciente || cpfPaciente.length !== 11) {
      return new Response(
        JSON.stringify({ error: 'CPF do paciente não informado ou inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Montar payload para PlugNotas
    const valorServico = Number(pagamento.valor_total) || 0;

    // Mapear cidade (UI salva "RJ" ou "SP", PlugNotas espera código IBGE)
    const codigoCidade = clinica.nf_cidade_emissao === 'RJ' ? '3304557' : '3550308';

    // Mapear regime tributário (UI salva: simples | lucro_presumido | lucro_real | mei)
    const simplesNacional = ['simples', 'mei'].includes(clinica.nf_regime_tributario);
    const regimeTributario = clinica.nf_regime_tributario === 'lucro_presumido'
      ? 2
      : clinica.nf_regime_tributario === 'lucro_real'
        ? 3
        : 1;

    const codigoServico = String(clinica.nf_codigo_servico || '').trim();

    const nfsePayload = {
      idIntegracao: pagamento_id,
      prestador: {
        cpfCnpj: cnpjDigits,
        inscricaoMunicipal: clinica.nf_inscricao_municipal,
        razaoSocial: clinica.nome,
        simplesNacional,
        regimeTributario,
        endereco: {
          logradouro: clinica.endereco || 'Não informado',
          numero: 'S/N',
          codigoCidade,
          cep: '00000000',
        },
      },
      tomador: {
        cpfCnpj: cpfPaciente,
        razaoSocial: paciente?.nome || 'Consumidor Final',
        email: paciente?.email || undefined,
        endereco: paciente?.endereco ? {
          logradouro: paciente.endereco,
          numero: 'S/N',
          codigoCidade,
          cep: paciente.cep?.replace(/\D/g, '') || '00000000',
        } : undefined,
      },
      servico: [{
        codigo: codigoServico,
        discriminacao: clinica.nf_descricao_servico || agendamento?.tipo_servico || 'Serviço de saúde',
        cnae: '8630503', // CNAE para consultório médico
        iss: {
          tipoTributacao: 6, // Tributável
          aliquota: 2.00, // 2% padrão
        },
        valor: {
          servico: valorServico,
        },
      }],
    };

    console.log('Enviando NFS-e para PlugNotas:', JSON.stringify(nfsePayload, null, 2));

    // Chamar API do PlugNotas (endpoint espera um ARRAY de documentos)
    const plugnotasResponse = await fetch(`${PLUGNOTAS_BASE_URL}/nfse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': PLUGNOTAS_API_KEY,
      },
      body: JSON.stringify([nfsePayload]),
    });

    const plugnotasResult = await plugnotasResponse.json();
    const plugnotasDoc = Array.isArray(plugnotasResult) ? plugnotasResult[0] : plugnotasResult;
    console.log('Resposta PlugNotas:', JSON.stringify(plugnotasResult, null, 2));

    if (!plugnotasResponse.ok || plugnotasDoc?.error) {
      // Mapear erros do PlugNotas
      let errorMessage = 'Erro ao emitir nota fiscal';
      let errorDetails = '';

      if (plugnotasDoc?.error?.message) {
        errorMessage = plugnotasDoc.error.message;
        if (plugnotasDoc.error.data) {
          errorDetails = JSON.stringify(plugnotasDoc.error.data);
        }
      } else if (plugnotasDoc?.message) {
        errorMessage = plugnotasDoc.message;
      } else if (typeof plugnotasDoc?.error === 'string') {
        errorMessage = plugnotasDoc.error;
      }

      // Mensagem amigável para erro de empresa não encontrada
      if (errorMessage.includes('Não localizamos qualquer Empresa')) {
        const cnpjUsado = clinica.cnpj.replace(/\D/g, '');
        const ambiente = USE_PRODUCTION ? 'produção' : 'sandbox';
        errorMessage = `O CNPJ ${cnpjUsado} não está cadastrado no ambiente ${ambiente} do PlugNotas. ` +
          `Acesse o painel do PlugNotas (${ambiente === 'sandbox' ? 'app.sandbox.plugnotas.com.br' : 'app.plugnotas.com.br'}) ` +
          `e cadastre a empresa antes de emitir notas fiscais.`;
      }

      // Caso a NF já exista no PlugNotas (idIntegracao duplicado), tratar como sucesso e devolver o PDF/XML.
      if (errorMessage.includes('Já existe uma NFSe com os parâmetros informados')) {
        const current = plugnotasDoc?.error?.data?.current;
        const linkPdf = current?.pdf ?? null;
        const numeroNfse = current?.numeroNfse ? String(current.numeroNfse) : null;

        const { data: notaFiscalJaExiste } = await supabase
          .from('notas_fiscais')
          .upsert({
            id: nfExistente?.id,
            pagamento_id,
            paciente_id: paciente?.id,
            status_emissao: 'emitida',
            valor_nf: valorServico,
            numero_nf: numeroNfse ?? nfExistente?.numero_nf ?? null,
            link_nf: linkPdf,
            data_emissao: new Date().toISOString(),
          }, { onConflict: 'id' })
          .select()
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Nota fiscal já emitida para este pagamento',
            nfse_id: numeroNfse ?? nfExistente?.numero_nf ?? null,
            nota_fiscal: notaFiscalJaExiste ?? null,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('Erro PlugNotas:', errorMessage, errorDetails);

      // Salvar erro na tabela notas_fiscais
      await supabase.from('notas_fiscais').upsert({
        id: nfExistente?.id,
        pagamento_id,
        paciente_id: paciente?.id,
        status_emissao: 'erro',
        valor_nf: valorServico,
      }, { onConflict: 'id' });

      return new Response(
        JSON.stringify({ error: errorMessage, details: errorDetails }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sucesso - extrair dados da resposta
    const nfseId = plugnotasDoc?.id || plugnotasDoc?.documents?.[0]?.id;
    
    // Salvar/atualizar registro na tabela notas_fiscais
    const { data: notaFiscal, error: nfError } = await supabase
      .from('notas_fiscais')
      .upsert({
        id: nfExistente?.id,
        pagamento_id,
        paciente_id: paciente?.id,
        status_emissao: 'pendente', // Aguardando processamento da prefeitura
        valor_nf: valorServico,
        numero_nf: nfseId,
        data_emissao: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    if (nfError) {
      console.error('Erro ao salvar nota fiscal:', nfError);
    }

    console.log('NFS-e enviada com sucesso! ID:', nfseId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Nota fiscal enviada para processamento',
        nfse_id: nfseId,
        nota_fiscal: notaFiscal,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao emitir NFS-e:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao processar emissão de NF-e' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
