import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAgendamentoPayload {
  telefone: string;
  profissional_id: string;
  data: string; // ISO string
  tipo_servico: string;
  nome_paciente?: string;
  origem?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Usar service role key para bypasser RLS quando necessário
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: CreateAgendamentoPayload = await req.json();
    const { telefone, profissional_id, data, tipo_servico, nome_paciente, origem = 'whatsapp' } = payload;

    // Validar dados obrigatórios
    if (!telefone || !profissional_id || !data || !tipo_servico) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: telefone, profissional_id, data, tipo_servico' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o profissional existe e está ativo
    const { data: profissional, error: profissionalError } = await supabase
      .from('profissionais')
      .select('id, clinica_id, nome')
      .eq('id', profissional_id)
      .eq('ativo', true)
      .single();

    if (profissionalError || !profissional) {
      return new Response(
        JSON.stringify({ error: 'Profissional não encontrado ou inativo' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalizar telefone (remover caracteres especiais)
    const telefoneNormalizado = telefone.replace(/\D/g, '');

    // Buscar paciente pelo telefone
    let paciente;
    const { data: pacienteExistente } = await supabase
      .from('pacientes')
      .select('*')
      .eq('telefone', telefoneNormalizado)
      .eq('clinica_id', profissional.clinica_id)
      .eq('ativo', true)
      .single();

    if (pacienteExistente) {
      paciente = pacienteExistente;
    } else {
      // Criar novo paciente se não existir
      if (!nome_paciente) {
        return new Response(
          JSON.stringify({ error: 'Nome do paciente é obrigatório para novos cadastros' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: novoPaciente, error: pacienteError } = await supabase
        .from('pacientes')
        .insert({
          nome: nome_paciente,
          telefone: telefoneNormalizado,
          cpf: `WHATSAPP_${telefoneNormalizado}`, // CPF temporário para WhatsApp
          clinica_id: profissional.clinica_id,
          ativo: true
        })
        .select()
        .single();

      if (pacienteError || !novoPaciente) {
        console.error('Erro ao criar paciente:', pacienteError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar paciente' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      paciente = novoPaciente;
    }

    // Calcular data_inicio e data_fim
    const dataInicio = new Date(data);
    const dataFim = new Date(dataInicio.getTime() + 60 * 60 * 1000); // 1 hora depois

    // Verificar conflitos de horário
    const { data: conflitos } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('profissional_id', profissional_id)
      .eq('desmarcada', false)
      .or(`data_inicio.lte.${dataFim.toISOString()},data_fim.gte.${dataInicio.toISOString()}`)
      .neq('status', 'faltou');

    if (conflitos && conflitos.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Conflito de horário. Já existe um agendamento neste período.',
          horario_conflito: {
            data_inicio: dataInicio.toISOString(),
            data_fim: dataFim.toISOString()
          }
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar agendamento
    const { data: novoAgendamento, error: agendamentoError } = await supabase
      .from('agendamentos')
      .insert({
        paciente_id: paciente.id,
        profissional_id: profissional_id,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        tipo_servico: tipo_servico,
        status: 'pendente',
        origem: origem,
        observacoes: `Agendamento criado via ${origem}`
      })
      .select(`
        *,
        pacientes:paciente_id (nome, telefone),
        profissionais:profissional_id (nome)
      `)
      .single();

    if (agendamentoError || !novoAgendamento) {
      console.error('Erro ao criar agendamento:', agendamentoError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar agendamento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log da operação
    console.log('Agendamento criado via WhatsApp:', {
      agendamento_id: novoAgendamento.id,
      paciente: paciente.nome,
      telefone: telefoneNormalizado,
      profissional: profissional.nome,
      data_inicio: dataInicio.toISOString(),
      origem
    });

    return new Response(
      JSON.stringify({
        success: true,
        agendamento: novoAgendamento,
        paciente_criado: !pacienteExistente,
        message: `Agendamento criado com sucesso para ${paciente.nome} em ${dataInicio.toLocaleString('pt-BR')}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função criar-agendamento:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});