import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, CheckCircle, XCircle, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface WhatsappProfissional {
  id: string;
  profissional_id: string;
  numero_telefone: string;
  api_key_n8n?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export function ConfiguracaoWhatsApp() {
  const { profissional } = useAuth();
  const queryClient = useQueryClient();
  const [numeroTelefone, setNumeroTelefone] = useState('');
  const [apiKeyN8N, setApiKeyN8N] = useState('');

  // Buscar configuração existente
  const { data: configuracao, isLoading } = useQuery({
    queryKey: ['whatsapp-config', profissional?.id],
    queryFn: async () => {
      if (!profissional?.id) return null;
      
      const { data, error } = await supabase
        .from('whatsapp_profissionais')
        .select('*')
        .eq('profissional_id', profissional.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }
      
      return data as WhatsappProfissional | null;
    },
    enabled: !!profissional?.id,
  });

  // Mutation para salvar configuração
  const salvarConfiguracao = useMutation({
    mutationFn: async (data: { numero_telefone: string; api_key_n8n?: string }) => {
      if (!profissional?.id) throw new Error('Profissional não encontrado');

      const payload = {
        profissional_id: profissional.id,
        numero_telefone: data.numero_telefone.replace(/\D/g, ''), // Remove formatação
        api_key_n8n: data.api_key_n8n || null,
        ativo: true,
      };

      if (configuracao?.id) {
        // Atualizar configuração existente
        const { data: result, error } = await supabase
          .from('whatsapp_profissionais')
          .update(payload)
          .eq('id', configuracao.id)
          .select()
          .single();
        
        if (error) throw error;
        return result;
      } else {
        // Criar nova configuração
        const { data: result, error } = await supabase
          .from('whatsapp_profissionais')
          .insert(payload)
          .select()
          .single();
        
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      toast.success('Configuração do WhatsApp salva com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
    },
    onError: (error) => {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração do WhatsApp');
    },
  });

  // Mutation para desativar configuração
  const desativarConfiguracao = useMutation({
    mutationFn: async () => {
      if (!configuracao?.id) throw new Error('Configuração não encontrada');

      const { error } = await supabase
        .from('whatsapp_profissionais')
        .update({ ativo: false })
        .eq('id', configuracao.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Integração WhatsApp desativada');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
    },
    onError: (error) => {
      console.error('Erro ao desativar configuração:', error);
      toast.error('Erro ao desativar integração WhatsApp');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!numeroTelefone.trim()) {
      toast.error('Número do WhatsApp é obrigatório');
      return;
    }

    salvarConfiguracao.mutate({
      numero_telefone: numeroTelefone,
      api_key_n8n: apiKeyN8N,
    });
  };

  // Preencher formulário com dados existentes
  if (configuracao && !numeroTelefone && !apiKeyN8N) {
    setNumeroTelefone(configuracao.numero_telefone);
    setApiKeyN8N(configuracao.api_key_n8n || '');
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConectado = configuracao?.ativo;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle>Integração WhatsApp</CardTitle>
          </div>
          <Badge variant={isConectado ? "default" : "secondary"} className="flex items-center space-x-1">
            {isConectado ? (
              <>
                <CheckCircle className="h-3 w-3" />
                <span>Integrado</span>
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                <span>Desconectado</span>
              </>
            )}
          </Badge>
        </div>
        <CardDescription>
          Configure a integração com WhatsApp para permitir agendamentos automáticos via N8N e Evolution API.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="numero">Número do WhatsApp</Label>
            <Input
              id="numero"
              type="tel"
              placeholder="5511999999999 (apenas números)"
              value={numeroTelefone}
              onChange={(e) => setNumeroTelefone(e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Digite o número completo com código do país e DDD, apenas números (ex: 5511999999999)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key N8N (Opcional)</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Deixe em branco se usar configuração global"
              value={apiKeyN8N}
              onChange={(e) => setApiKeyN8N(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Chave de API específica para este profissional. Deixe em branco para usar a configuração global do N8N.
            </p>
          </div>

          <div className="flex space-x-2">
            <Button 
              type="submit" 
              disabled={salvarConfiguracao.isPending}
            >
              <Settings className="mr-2 h-4 w-4" />
              {salvarConfiguracao.isPending ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
            
            {isConectado && (
              <Button 
                type="button"
                variant="outline"
                onClick={() => desativarConfiguracao.mutate()}
                disabled={desativarConfiguracao.isPending}
              >
                {desativarConfiguracao.isPending ? 'Desativando...' : 'Desativar'}
              </Button>
            )}
          </div>
        </form>

        {isConectado && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Integração Ativa</h4>
            <p className="text-sm text-green-700 mb-2">
              WhatsApp conectado: <span className="font-mono font-medium">+{configuracao.numero_telefone}</span>
            </p>
            <p className="text-sm text-green-700">
              Os pacientes podem enviar mensagens para este número para agendar, reagendar ou cancelar consultas automaticamente.
            </p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Sobre a Integração</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Os pacientes podem enviar mensagens em linguagem natural</p>
            <p>• A IA interpreta automaticamente a intenção (agendar, remarcar, cancelar)</p>
            <p>• Funciona através do N8N com Evolution API</p>
            <p>• Confirmações são enviadas automaticamente via WhatsApp</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}