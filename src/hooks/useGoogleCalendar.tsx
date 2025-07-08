import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface GoogleCalendarConfig {
  clientId: string
  redirectUri: string
  scope: string
}

export function useGoogleCalendar() {
  const [isConnected, setIsConnected] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const config: GoogleCalendarConfig = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: window.location.origin + '/agenda',
    scope: 'https://www.googleapis.com/auth/calendar'
  }

  useEffect(() => {
    // Verificar se há token armazenado
    const storedToken = localStorage.getItem('google_calendar_token')
    if (storedToken) {
      setAccessToken(storedToken)
      setIsConnected(true)
    }

    // Verificar se retornou da autorização do Google
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    
    if (code) {
      exchangeCodeForToken(code)
      // Limpar a URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const connectToGoogle = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${config.clientId}&` +
      `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
      `scope=${encodeURIComponent(config.scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent`

    window.location.href = authUrl
  }

  const exchangeCodeForToken = async (code: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: config.redirectUri,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to exchange code for token')
      }

      const tokens = await response.json()
      
      if (tokens.access_token) {
        setAccessToken(tokens.access_token)
        localStorage.setItem('google_calendar_token', tokens.access_token)
        if (tokens.refresh_token) {
          localStorage.setItem('google_refresh_token', tokens.refresh_token)
        }
        setIsConnected(true)
        toast.success('Google Calendar conectado com sucesso!')
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error)
      toast.error('Erro ao conectar com Google Calendar')
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = () => {
    localStorage.removeItem('google_calendar_token')
    localStorage.removeItem('google_refresh_token')
    setAccessToken(null)
    setIsConnected(false)
    toast.success('Google Calendar desconectado')
  }

  const syncToGoogle = async (agendamento: any) => {
    if (!accessToken) {
      toast.error('Google Calendar não está conectado')
      return null
    }

    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: {
          action: 'sync_to_google',
          agendamento,
          accessToken
        }
      })

      if (error) throw error

      if (data.success) {
        toast.success('Evento sincronizado com Google Calendar!')
        return data.googleEventId
      }
    } catch (error) {
      console.error('Error syncing to Google:', error)
      toast.error('Erro ao sincronizar com Google Calendar')
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
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
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
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
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