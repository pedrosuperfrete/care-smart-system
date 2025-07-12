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

    // Verificar se voltou da conexão do Google
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      toast.success('Google Calendar conectado com sucesso!');
      // Limpar o parâmetro da URL
      window.history.replaceState({}, '', '/agenda');
    }
  }, [profissional]);

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    try {
      // Buscar o Client ID do Google via Edge Function
      const { data, error } = await supabase.functions.invoke('google-oauth-config');
      
      if (error || !data?.clientId) {
        throw new Error('Configuração do Google não encontrada');
      }

      const redirectUri = 'https://zxgkspeehamsrfhynbzr.supabase.co/functions/v1/google-oauth';
      const scope = 'https://www.googleapis.com/auth/calendar';
      
      // URL para autorização OAuth
      const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
      authUrl.searchParams.set('client_id', data.clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', profissional?.id || '');

      // Redirecionar para OAuth
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Erro ao conectar com Google:', error);
      toast.error('Erro ao conectar com Google Calendar');
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
      console.error('Erro ao desconectar:', error);
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