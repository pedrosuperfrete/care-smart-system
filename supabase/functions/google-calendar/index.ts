import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to log errors to database
async function logError(
  agendamentoId: string,
  userId: string | null,
  profissionalId: string | null,
  errorMessage: string,
  action: string
) {
  try {
    console.log(`[ERROR LOG] ${action} - Agendamento ${agendamentoId}: ${errorMessage}`);
    
    const { error } = await supabase
      .from('erros_sistema')
      .insert({
        user_id: userId,
        profissional_id: profissionalId,
        tipo: 'calendar_sync',
        entidade_id: agendamentoId,
        mensagem_erro: `${action}: ${errorMessage}`,
        data_ocorrencia: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao salvar log no banco:', error);
    }
  } catch (err) {
    console.error('Erro crítico ao salvar log:', err);
  }
}

interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  return data.access_token;
}

async function createCalendarEvent(accessToken: string, event: GoogleCalendarEvent): Promise<string> {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  const data = await response.json();
  return data.id;
}

async function updateCalendarEvent(accessToken: string, eventId: string, event: GoogleCalendarEvent): Promise<void> {
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
}

async function deleteCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let agendamentoId: string | null = null;
  let userId: string | null = null;
  let profissionalId: string | null = null;
  let action: string = '';

  try {
    const requestData = await req.json();
    action = requestData.action;
    agendamentoId = requestData.agendamentoId;

    // Buscar dados do agendamento e profissional
    const { data: agendamento, error: agendamentoError } = await supabase
      .from('agendamentos')
      .select(`
        *,
        pacientes:paciente_id (nome, email),
        profissionais:profissional_id (nome, google_refresh_token, user_id)
      `)
      .eq('id', agendamentoId)
      .single();

    if (agendamentoError || !agendamento) {
      throw new Error('Agendamento não encontrado');
    }

    const profissional = agendamento.profissionais;
    const paciente = agendamento.pacientes;
    userId = profissional.user_id;
    profissionalId = agendamento.profissional_id;

    if (!profissional.google_refresh_token) {
      throw new Error('Profissional não tem token do Google configurado');
    }

    let accessToken: string;
    try {
      accessToken = await getAccessToken(profissional.google_refresh_token);
    } catch (tokenError) {
      throw new Error(`Erro ao obter token do Google: ${tokenError.message}`);
    }

    const calendarEvent: GoogleCalendarEvent = {
      summary: `${agendamento.tipo_servico} - ${paciente.nome}`,
      description: `Consulta com ${paciente.nome}\nServiço: ${agendamento.tipo_servico}\nObservações: ${agendamento.observacoes || 'Nenhuma'}`,
      start: {
        dateTime: agendamento.data_inicio,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: agendamento.data_fim,
        timeZone: 'America/Sao_Paulo',
      },
    };

    let result = {};

    switch (action) {
      case 'create':
        try {
          const eventId = await createCalendarEvent(accessToken, calendarEvent);
          
          // Atualizar agendamento com o ID do evento do Google
          await supabase
            .from('agendamentos')
            .update({ google_event_id: eventId })
            .eq('id', agendamentoId);
          
          result = { eventId };
        } catch (createError) {
          throw new Error(`Erro ao criar evento no Google Calendar: ${createError.message}`);
        }
        break;

      case 'update':
        if (!agendamento.google_event_id) {
          throw new Error('Agendamento não tem evento do Google associado');
        }
        
        try {
          await updateCalendarEvent(accessToken, agendamento.google_event_id, calendarEvent);
          result = { success: true };
        } catch (updateError) {
          throw new Error(`Erro ao atualizar evento no Google Calendar: ${updateError.message}`);
        }
        break;

      case 'delete':
        if (agendamento.google_event_id) {
          try {
            await deleteCalendarEvent(accessToken, agendamento.google_event_id);
            
            // Remover o ID do evento do Google do agendamento
            await supabase
              .from('agendamentos')
              .update({ google_event_id: null })
              .eq('id', agendamentoId);
          } catch (deleteError) {
            throw new Error(`Erro ao deletar evento no Google Calendar: ${deleteError.message}`);
          }
        }
        result = { success: true };
        break;

      default:
        throw new Error('Ação inválida');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função Google Calendar:', error);
    
    // Log error to database if we have the necessary info
    if (agendamentoId && action) {
      await logError(agendamentoId, userId, profissionalId, error.message, action);
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});