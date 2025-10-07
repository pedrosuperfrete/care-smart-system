import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, CheckCircle, XCircle, Settings, User, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { HorarioAtendimento } from './HorarioAtendimento';
import { Checkbox } from '@/components/ui/checkbox';

interface WhatsappProfissional {
  id: string;
  profissional_id: string;
  numero_telefone: string;
  api_key_n8n?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

const formasPagamentoDisponiveis = [
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Transferência Bancária'
];

interface ServicoPreco {
  nome: string;
  preco: string;
}

export function ConfiguracaoWhatsApp() {
  const { profissional, updateProfissional } = useAuth();
  const queryClient = useQueryClient();
  const [numeroTelefone, setNumeroTelefone] = useState('');
  const [apiKeyN8N, setApiKeyN8N] = useState('');
  const [activeTab, setActiveTab] = useState('whatsapp');
  
  // Estados para o perfil
  const [nomeClinica, setNomeClinica] = useState(profissional?.nome_clinica || '');
  const [cnpjClinica, setCnpjClinica] = useState('');
  const [enderecoClinica, setEnderecoClinica] = useState('');
  const [horariosAtendimento, setHorariosAtendimento] = useState(profissional?.horarios_atendimento || {});
  const [servicosPrecos, setServicosPrecos] = useState<ServicoPreco[]>(
    (profissional?.servicos_precos ? JSON.parse(JSON.stringify(profissional.servicos_precos)) : []) as ServicoPreco[]
  );
  const [formasPagamento, setFormasPagamento] = useState<string[]>(
    (profissional?.formas_pagamento ? JSON.parse(JSON.stringify(profissional.formas_pagamento)) : []) as string[]
  );
  const [planosSaude, setPlanosSaude] = useState<string[]>(
    (profissional?.planos_saude ? JSON.parse(JSON.stringify(profissional.planos_saude)) : []) as string[]
  );

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
  // Mostrar aba de perfil se faltar dados da clínica (CNPJ especialmente)
  const perfilIncompleto = !cnpjClinica || cnpjClinica === '';

  const handleSalvarPerfil = async () => {
    try {
      if (!nomeClinica || !cnpjClinica) {
        toast.error('Preencha o nome e CNPJ da clínica');
        return;
      }

      let clinicaId = profissional?.clinica_id;

      // Verificar se o CNPJ já existe em outra clínica
      const { data: cnpjExistente } = await supabase
        .from('clinicas')
        .select('id, cnpj')
        .eq('cnpj', cnpjClinica)
        .neq('id', clinicaId || 'none');

      if (cnpjExistente && cnpjExistente.length > 0) {
        toast.error('Este CNPJ já está cadastrado em outra clínica.');
        return;
      }

      // Atualizar ou criar clínica
      if (clinicaId) {
        const { error: clinicaError } = await supabase
          .from('clinicas')
          .update({
            nome: nomeClinica,
            cnpj: cnpjClinica,
            endereco: enderecoClinica || null,
          })
          .eq('id', clinicaId);

        if (clinicaError) {
          toast.error('Erro ao atualizar clínica: ' + clinicaError.message);
          return;
        }
      } else {
        const { data: clinicaData, error: clinicaError } = await supabase
          .from('clinicas')
          .insert({
            nome: nomeClinica,
            cnpj: cnpjClinica,
            endereco: enderecoClinica || null,
          })
          .select()
          .single();

        if (clinicaError) {
          toast.error('Erro ao criar clínica: ' + clinicaError.message);
          return;
        }

        clinicaId = clinicaData.id;
      }

      // Atualizar profissional
      await updateProfissional({
        nome_clinica: nomeClinica,
        clinica_id: clinicaId,
        horarios_atendimento: horariosAtendimento,
        servicos_precos: JSON.parse(JSON.stringify(servicosPrecos)),
        formas_pagamento: JSON.parse(JSON.stringify(formasPagamento)),
        planos_saude: JSON.parse(JSON.stringify(planosSaude)),
        onboarding_completo: true,
      });

      toast.success('Perfil completado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil');
    }
  };

  const addServicoPreco = () => {
    setServicosPrecos([...servicosPrecos, { nome: '', preco: '' }]);
  };

  const removeServicoPreco = (index: number) => {
    setServicosPrecos(servicosPrecos.filter((_, i) => i !== index));
  };

  const updateServicoPreco = (index: number, field: 'nome' | 'preco', value: string) => {
    const newServicos = [...servicosPrecos];
    newServicos[index][field] = value;
    setServicosPrecos(newServicos);
  };

  const handleFormaPagamentoChange = (forma: string, checked: boolean) => {
    const newFormas = checked 
      ? [...formasPagamento, forma]
      : formasPagamento.filter(f => f !== forma);
    
    setFormasPagamento(newFormas);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <CardTitle>Integração WhatsApp</CardTitle>
        </div>
        <CardDescription>
          Configure a integração com WhatsApp para permitir agendamentos automáticos via N8N e Evolution API.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {perfilIncompleto ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                1. Integração WhatsApp
              </TabsTrigger>
              <TabsTrigger value="perfil" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                2. Completar Perfil
              </TabsTrigger>
            </TabsList>

            <TabsContent value="whatsapp" className="space-y-4 mt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Atenção:</strong> Complete seu perfil na próxima aba para aproveitar todos os recursos.
                </p>
              </div>

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
            </TabsContent>

            <TabsContent value="perfil" className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome_clinica">Nome da Clínica *</Label>
                <Input
                  id="nome_clinica"
                  value={nomeClinica}
                  onChange={(e) => setNomeClinica(e.target.value)}
                  placeholder="Nome que será exibido aos pacientes"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj_clinica">CNPJ da Clínica *</Label>
                  <Input
                    id="cnpj_clinica"
                    value={cnpjClinica}
                    onChange={(e) => setCnpjClinica(e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco_clinica">Endereço da Clínica</Label>
                  <Input
                    id="endereco_clinica"
                    value={enderecoClinica}
                    onChange={(e) => setEnderecoClinica(e.target.value)}
                    placeholder="Endereço completo (opcional)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <HorarioAtendimento
                  value={horariosAtendimento}
                  onChange={setHorariosAtendimento}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Serviços com Preços *</Label>
                  <Button type="button" onClick={addServicoPreco} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                
                {servicosPrecos.map((servico, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="Nome do serviço"
                        value={servico.nome}
                        onChange={(e) => updateServicoPreco(index, 'nome', e.target.value)}
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        placeholder="R$ 0,00"
                        value={servico.preco}
                        onChange={(e) => updateServicoPreco(index, 'preco', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeServicoPreco(index)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <Label>Formas de Pagamento Aceitas *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {formasPagamentoDisponiveis.map((forma) => (
                    <div key={forma} className="flex items-center space-x-2">
                      <Checkbox
                        id={`perfil-${forma}`}
                        checked={formasPagamento.includes(forma)}
                        onCheckedChange={(checked) => handleFormaPagamentoChange(forma, !!checked)}
                      />
                      <Label
                        htmlFor={`perfil-${forma}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {forma}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Planos de Saúde Aceitos</Label>
                  <Button 
                    type="button" 
                    onClick={() => setPlanosSaude([...planosSaude, ''])}
                    size="sm" 
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                
                {planosSaude.map((plano: string, index: number) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input
                        placeholder="Nome do plano de saúde"
                        value={plano}
                        onChange={(e) => {
                          const newPlanos = [...planosSaude];
                          newPlanos[index] = e.target.value;
                          setPlanosSaude(newPlanos);
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => setPlanosSaude(planosSaude.filter((_, i) => i !== index))}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={handleSalvarPerfil} className="w-full">
                <User className="mr-2 h-4 w-4" />
                Salvar e Completar Perfil
              </Button>
            </TabsContent>
          </Tabs>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}