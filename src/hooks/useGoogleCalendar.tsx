import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function useGoogleCalendar() {
  const [isConnected, setIsConnected] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Verificar se o usuário já está conectado via Supabase Auth
    checkAuthStatus()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.provider_token) {
        setAccessToken(session.provider_token)
        setIsConnected(true)
        toast.success('Google Calendar conectado com sucesso!')
      } else if (event === 'SIGNED_OUT') {
        setAccessToken(null)
        setIsConnected(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAuthStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.provider_token) {
      setAccessToken(session.provider_token)
      setIsConnected(true)
    }
  }

  const connectToGoogle = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/agenda`,
          scopes: 'https://www.googleapis.com/auth/calendar'
        }
      })

      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error connecting to Google:', error)
      toast.error('Erro ao conectar com Google Calendar')
      setIsLoading(false)
    }
  }

  const disconnect = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setAccessToken(null)
      setIsConnected(false)
      toast.success('Google Calendar desconectado')
    } catch (error) {
      console.error('Error disconnecting:', error)
      toast.error('Erro ao desconectar')
    }
  }

  const syncToGoogle = async (agendamento: any) => {
    if (!accessToken) {
      toast.error('Google Calendar não está conectado')
      return null
    }

    try {
      // Obter token de autenticação do Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('Supabase session not found')
        toast.error('Sessão não encontrada')
        return null
      }

      console.log('Syncing to Google Calendar:', {
        action: 'sync_to_google',
        agendamentoId: agendamento.id,
        hasAccessToken: !!accessToken
      })

      const requestBody = {
        action: 'sync_to_google',
        agendamento,
        accessToken
      }

      console.log('Sending request to Google Calendar sync:', requestBody)

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: requestBody
      })

      if (error) {
        console.error('Supabase function error:', error)
        throw error
      }

      console.log('Google Calendar sync response:', data)

      if (data?.success) {
        toast.success('Evento sincronizado com Google Calendar!')
        return data.googleEventId
      } else {
        console.error('Sync failed:', data)
        toast.error('Falha na sincronização com Google Calendar')
        return null
      }
    } catch (error) {
      console.error('Error syncing to Google:', error)
      
      // Se for um erro da edge function, tentar extrair a mensagem específica
      if (error instanceof Error && error.message.includes('Edge Function returned a non-2xx status code')) {
        // Tentar fazer uma nova chamada para pegar o erro detalhado
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const response = await fetch(`https://zxgkspeehamsrfhynbzr.supabase.co/functions/v1/google-calendar-sync`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4Z2tzcGVlaGFtc3JmaHluYnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjI5MTIsImV4cCI6MjA2NTY5ODkxMn0.4be3mie_aWh91sHAxLQz4WW1Xl00F3egMOY1BxrFg9c',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: 'sync_to_google',
              agendamento,
              accessToken
            })
          })
          
          const errorData = await response.json()
          console.error('Detailed error from edge function:', errorData)
          toast.error(`Erro detalhado: ${errorData.error || 'Erro desconhecido'}`)
        } catch (fetchError) {
          console.error('Failed to get detailed error:', fetchError)
          toast.error('Erro ao sincronizar com Google Calendar')
        }
      } else {
        toast.error('Erro ao sincronizar com Google Calendar')
      }
      
      return null
    }
  }

  const syncFromGoogle = async () => {
    if (!accessToken) {
      toast.error('Google Calendar não está conectado')
      return
    }

    setIsLoading(true)
    try {
      // Obter token de autenticação do Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Sessão não encontrada')
        return
      }

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: {
          action: 'sync_from_google',
          accessToken
        }
      })

      if (error) throw error

      if (data.success) {
        toast.success(`${data.syncedCount} eventos importados do Google Calendar!`)
      }
    } catch (error) {
      console.error('Error syncing from Google:', error)
      toast.error('Erro ao importar do Google Calendar')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteFromGoogle = async (googleEventId: string) => {
    if (!accessToken || !googleEventId) return

    try {
      // Obter token de autenticação do Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Sessão não encontrada')
        return
      }

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: {
          action: 'delete_from_google',
          agendamento: { google_event_id: googleEventId },
          accessToken
        }
      })

      if (error) throw error

      if (data.success) {
        toast.success('Evento removido do Google Calendar!')
      }
    } catch (error) {
      console.error('Error deleting from Google:', error)
      toast.error('Erro ao remover do Google Calendar')
    }
  }

  return {
    isConnected,
    isLoading,
    connectToGoogle,
    disconnect,
    syncToGoogle,
    syncFromGoogle,
    deleteFromGoogle
  }
}