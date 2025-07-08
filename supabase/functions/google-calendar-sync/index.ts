import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, agendamento, accessToken } = await req.json()

    switch (action) {
      case 'sync_to_google':
        return await syncToGoogle(agendamento, accessToken)
      case 'sync_from_google':
        return await syncFromGoogle(user.id, accessToken, supabaseClient)
      case 'delete_from_google':
        return await deleteFromGoogle(agendamento.google_event_id, accessToken)
      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function syncToGoogle(agendamento: any, accessToken: string) {
  const calendarId = 'primary'
  
  // Buscar dados do paciente e profissional
  const { data: paciente } = await supabase
    .from('pacientes')
    .select('nome, email')
    .eq('id', agendamento.paciente_id)
    .single()

  const { data: profissional } = await supabase
    .from('profissionais')
    .select('nome')
    .eq('id', agendamento.profissional_id)
    .single()

  const event = {
    summary: `${agendamento.tipo_servico} - ${paciente?.nome}`,
    description: `Consulta com ${profissional?.nome}\n${agendamento.observacoes || ''}`,
    start: {
      dateTime: agendamento.data_inicio,
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: agendamento.data_fim,
      timeZone: 'America/Sao_Paulo',
    },
    attendees: paciente?.email ? [{ email: paciente.email }] : [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 dia antes
        { method: 'popup', minutes: 15 }, // 15 minutos antes
      ],
    },
  }

  const url = agendamento.google_event_id 
    ? `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${agendamento.google_event_id}`
    : `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`

  const method = agendamento.google_event_id ? 'PUT' : 'POST'

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Google Calendar API error:', error)
    throw new Error(`Failed to sync to Google Calendar: ${error}`)
  }

  const googleEvent = await response.json()
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      googleEventId: googleEvent.id,
      htmlLink: googleEvent.htmlLink 
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function syncFromGoogle(userId: string, accessToken: string, supabaseClient: any) {
  const calendarId = 'primary'
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Google Calendar events')
  }

  const { items: events } = await response.json()

  // Filtrar apenas eventos criados pela nossa aplicação ou que tenham palavras-chave
  const medicalEvents = events.filter((event: any) => 
    event.summary?.toLowerCase().includes('consulta') ||
    event.summary?.toLowerCase().includes('retorno') ||
    event.summary?.toLowerCase().includes('exame') ||
    event.description?.toLowerCase().includes('consulta')
  )

  const syncedEvents = []

  for (const event of medicalEvents) {
    // Verificar se já existe no banco
    const { data: existing } = await supabaseClient
      .from('agendamentos')
      .select('id')
      .eq('google_event_id', event.id)
      .single()

    if (!existing && event.start?.dateTime && event.end?.dateTime) {
      // Criar novo agendamento baseado no evento do Google
      const { data: profissional } = await supabaseClient
        .from('profissionais')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (profissional) {
        syncedEvents.push({
          profissional_id: profissional.id,
          data_inicio: event.start.dateTime,
          data_fim: event.end.dateTime,
          tipo_servico: 'Consulta importada',
          observacoes: `Importado do Google Calendar: ${event.summary}`,
          google_event_id: event.id,
          status: 'pendente'
        })
      }
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      syncedCount: syncedEvents.length,
      events: syncedEvents 
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function deleteFromGoogle(googleEventId: string, accessToken: string) {
  if (!googleEventId) {
    return new Response(
      JSON.stringify({ success: true, message: 'No Google event to delete' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const calendarId = 'primary'
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to delete from Google Calendar')
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}