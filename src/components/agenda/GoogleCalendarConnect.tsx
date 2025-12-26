import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Link, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function GoogleCalendarConnect() {
  const { profissional } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profissional?.google_refresh_token) {
      setIsConnected(true);
    }

    // Check if returned from Google connection
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      toast.success('Google Calendar conectado com sucesso!');
      // Clear the URL parameter
      window.history.replaceState({}, '', '/agenda');
    }
    if (urlParams.get('error') === 'invalid_state') {
      toast.error('Erro de segurança: sessão expirada. Tente novamente.');
      window.history.replaceState({}, '', '/agenda');
    }
    if (urlParams.get('error') === 'forbidden') {
      toast.error('Erro: você não tem permissão para conectar este profissional.');
      window.history.replaceState({}, '', '/agenda');
    }
  }, [profissional]);

  const handleConnectGoogle = async () => {
    if (!profissional?.id) {
      toast.error('Profissional não encontrado');
      return;
    }

    setIsLoading(true);
    try {
      // First, get a signed state parameter from the server
      const { data: stateData, error: stateError } = await supabase.functions.invoke('google-oauth', {
        body: { professionalId: profissional.id },
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      // The function call above doesn't work well with query params, so we need to call it differently
      // We'll use fetch directly with the action parameter
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        toast.error('Você precisa estar logado para conectar o Google Calendar');
        return;
      }

      const stateResponse = await fetch(
        `https://zxgkspeehamsrfhynbzr.supabase.co/functions/v1/google-oauth?action=generate-state`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ professionalId: profissional.id }),
        }
      );

      if (!stateResponse.ok) {
        const errorData = await stateResponse.json();
        throw new Error(errorData.error || 'Erro ao gerar estado de segurança');
      }

      const { state } = await stateResponse.json();

      // Get the Google Client ID
      const { data: configData, error: configError } = await supabase.functions.invoke('google-oauth-config');
      
      if (configError || !configData?.clientId) {
        throw new Error('Configuração do Google não encontrada');
      }

      const redirectUri = 'https://zxgkspeehamsrfhynbzr.supabase.co/functions/v1/google-oauth';
      const scope = 'https://www.googleapis.com/auth/calendar';
      
      // URL for OAuth authorization
      const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
      authUrl.searchParams.set('client_id', configData.clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', state);

      // Redirect to OAuth
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Error connecting to Google:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao conectar com Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profissionais')
        .update({ google_refresh_token: null })
        .eq('id', profissional?.id);

      if (error) throw error;

      setIsConnected(false);
      toast.success('Desconectado do Google Calendar');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar do Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Google Calendar</CardTitle>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center space-x-1">
            {isConnected ? (
              <>
                <CheckCircle className="h-3 w-3" />
                <span>Conectado</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                <span>Desconectado</span>
              </>
            )}
          </Badge>
        </div>
        <CardDescription>
          {isConnected 
            ? 'Seus agendamentos são sincronizados automaticamente com o Google Calendar'
            : 'Conecte sua conta do Google para sincronizar automaticamente os agendamentos'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link className="h-4 w-4" />
            <span>
              {isConnected 
                ? 'Sincronização ativa' 
                : 'Clique para conectar sua conta Google'
              }
            </span>
          </div>
          
          {isConnected ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDisconnectGoogle}
              disabled={isLoading}
            >
              {isLoading ? 'Desconectando...' : 'Desconectar'}
            </Button>
          ) : (
            <Button 
              onClick={handleConnectGoogle}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? 'Conectando...' : 'Conectar Google'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
