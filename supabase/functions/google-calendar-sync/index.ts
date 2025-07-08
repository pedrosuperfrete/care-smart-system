import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Google Calendar Sync function called:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

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
      console.error('Missing authorization header')
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      throw new Error(`Unauthorized: ${authError?.message || 'Invalid user'}`)
    }

    console.log('User authenticated:', user.id)

    // Verificar se há conteúdo no body
    const contentType = req.headers.get('content-type')
    console.log('Content-Type:', contentType)
    
    let requestBody
    try {
      // Usar apenas req.json() pois o supabase.functions.invoke já envia como JSON
      requestBody = await req.json()
      console.log('Parsed request body:', requestBody)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error(`Invalid JSON body: ${parseError.message}`)
    }

    const { action, agendamento, accessToken } = requestBody

    if (!action) {
      throw new Error('Missing action parameter')
    }

    if (!accessToken) {
      throw new Error('Missing Google access token')
    }

    switch (action) {
      case 'sync_to_google':
        if (!agendamento) {
          throw new Error('Missing agendamento data')
        }
        return await syncToGoogle(agendamento, accessToken, supabaseClient)
      case 'sync_from_google':
        return await syncFromGoogle(user.id, accessToken, supabaseClient)
      case 'delete_from_google':
        return await deleteFromGoogle(agendamento.google_event_id, accessToken)
      default:
        throw new Error(`Invalid action: ${action}`)
    }

  } catch (error) {
    console.error('Edge function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString(),
        success: false
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function syncToGoogle(agendamento: any, accessToken: string, supabaseClient: any) {
  const calendarId = 'primary'
  
  // Buscar dados do paciente e profissional usando o cliente configurado
  const { data: paciente } = await supabaseClient
    .from('pacientes')
    .select('nome, email')
    .eq('id', agendamento.paciente_id)
    .single()

  const { data: profissional } = await supabaseClient
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
  
  console.log('Google Calendar sync successful:', {
    googleEventId: googleEvent.id,
    htmlLink: googleEvent.htmlLink
  })
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      googleEventId: googleEvent.id,
      htmlLink: googleEvent.htmlLink 
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function syncFromGoogle(userId: string, accessToken: string, supabaseClient: any) {
  const calendarId = 'primary'
  const timeMin = new Date().toISOString()
  const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 dias

  console.log('Fetching Google Calendar events:', { timeMin, timeMax })

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Google Calendar API error:', errorText)
    throw new Error(`Failed to fetch Google Calendar events: ${errorText}`)
  }

  const { items: events } = await response.json()
  console.log(`Found ${events?.length || 0} events from Google Calendar`)

  // Filtrar apenas eventos criados pela nossa aplicação ou que tenham palavras-chave
  const medicalEvents = events.filter((event: any) => 
    event.summary?.toLowerCase().includes('consulta') ||
    event.summary?.toLowerCase().includes('retorno') ||
    event.summary?.toLowerCase().includes('exame') ||
    event.summary?.toLowerCase().includes('atendimento') ||
    event.description?.toLowerCase().includes('consulta')
  )

  console.log(`Filtered to ${medicalEvents.length} medical/relevant events`)

  const syncedEvents = []
  const pacienteExternoId = '00000000-0000-0000-0000-000000000001' // ID do paciente especial

  // Buscar profissional do usuário logado
  const { data: profissional } = await supabaseClient
    .from('profissionais')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!profissional) {
    throw new Error('Profissional não encontrado para o usuário')
  }

  for (const event of medicalEvents) {
    // Verificar se já existe no banco
    const { data: existing } = await supabaseClient
      .from('agendamentos')
      .select('id')
      .eq('google_event_id', event.id)
      .single()

    if (!existing && event.start?.dateTime && event.end?.dateTime) {
      // Tentar identificar paciente pelo email do participante
      let pacienteId = pacienteExternoId // padrão
      
      if (event.attendees && event.attendees.length > 0) {
        for (const attendee of event.attendees) {
          if (attendee.email) {
            const { data: paciente } = await supabaseClient
              .from('pacientes')
              .select('id')
              .eq('email', attendee.email.toLowerCase())
              .single()
            
            if (paciente) {
              pacienteId = paciente.id
              console.log(`Found matching patient for ${attendee.email}`)
              break
            }
          }
        }
      }

      // Criar novo agendamento baseado no evento do Google
      const novoAgendamento = {
        profissional_id: profissional.id,
        paciente_id: pacienteId,
        data_inicio: event.start.dateTime,
        data_fim: event.end.dateTime,
        tipo_servico: pacienteId === pacienteExternoId ? 'Evento Externo' : 'Consulta Importada',
        observacoes: `Importado do Google Calendar: ${event.summary || 'Sem título'}${event.description ? '\n' + event.description : ''}`,
        google_event_id: event.id,
        status: 'pendente'
      }
      
      syncedEvents.push(novoAgendamento)
    }
  }

  // Inserir os eventos novos no banco
  let insertedCount = 0
  if (syncedEvents.length > 0) {
    console.log(`Inserting ${syncedEvents.length} new appointments from Google Calendar`)
    
    const { data: inserted, error } = await supabaseClient
      .from('agendamentos')
      .insert(syncedEvents)
      .select('id')

    if (error) {
      console.error('Error inserting imported appointments:', error)
      throw new Error(`Failed to insert imported events: ${error.message}`)
    }

    insertedCount = inserted?.length || 0
    console.log(`Successfully inserted ${insertedCount} appointments`)
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      syncedCount: insertedCount,
      totalEventsFound: events?.length || 0,
      filteredEvents: medicalEvents.length
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

async function deleteFromGoogle(googleEventId: string, accessToken: string) {
  if (!googleEventId) {
    return new Response(
      JSON.stringify({ success: true, message: 'No Google event to delete' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
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
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}