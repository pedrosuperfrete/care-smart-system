import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Cake, 
  Stethoscope, 
  CalendarClock, 
  ClipboardCheck,
  MessageSquarePlus,
  Save,
  Trash2,
  Edit2,
  Plus,
  Sparkles,
  Bell
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MensagemProativa {
  id: string;
  profissional_id: string;
  tipo_mensagem: string;
  nome_mensagem: string;
  conteudo_mensagem: string;
  ativo: boolean;
  trigger_descricao: string | null;
  criado_em: string;
  atualizado_em: string;
}

// Mensagens padrão com templates sugeridos
const mensagensPadrao = [
  {
    tipo: 'aniversario',
    nome: 'Mensagem de Aniversário',
    icone: Cake,
    triggerPadrao: 'Enviar no dia do aniversário do paciente',
    conteudoPadrao: 'Olá {nome}! 🎂\n\nA equipe da {clinica} deseja um Feliz Aniversário! Que seu dia seja repleto de saúde, alegria e muitas realizações.\n\nUm grande abraço!'
  },
  {
    tipo: 'pos_consulta',
    nome: 'Mensagem Pós-Consulta',
    icone: Stethoscope,
    triggerPadrao: 'Enviar 1 dia após a consulta realizada',
    conteudoPadrao: 'Olá {nome}!\n\nEsperamos que esteja bem após sua consulta. Caso tenha alguma dúvida sobre as orientações passadas, estamos à disposição!\n\nAtenciosamente,\n{profissional}'
  },
  {
    tipo: 'lembrete_retorno',
    nome: 'Lembrete de Retorno',
    icone: CalendarClock,
    triggerPadrao: 'Enviar 30 dias após última consulta sem novo agendamento',
    conteudoPadrao: 'Olá {nome}!\n\nFaz algum tempo desde sua última visita. Gostaria de lembrar da importância de manter suas consultas em dia.\n\nAgende seu retorno conosco! 📅\n\n{clinica}'
  },
  {
    tipo: 'pos_exame',
    nome: 'Mensagem Pós-Exame',
    icone: ClipboardCheck,
    triggerPadrao: 'Enviar quando resultado do exame estiver disponível',
    conteudoPadrao: 'Olá {nome}!\n\nO resultado do seu exame já está disponível. Entre em contato para agendar uma consulta de acompanhamento.\n\nAtenciosamente,\n{clinica}'
  },
  {
    tipo: 'confirmacao_agendamento',
    nome: 'Confirmação de Agendamento',
    icone: Bell,
    triggerPadrao: 'Enviar 24h antes do agendamento',
    conteudoPadrao: 'Olá {nome}! 📅\n\nLembramos que você tem uma consulta agendada para amanhã às {horario}.\n\nConfirme sua presença respondendo esta mensagem.\n\n{clinica}'
  },
  {
    tipo: 'boas_vindas',
    nome: 'Boas-vindas Novo Paciente',
    icone: Sparkles,
    triggerPadrao: 'Enviar após primeiro cadastro do paciente',
    conteudoPadrao: 'Olá {nome}! 👋\n\nSeja bem-vindo(a) à {clinica}!\n\nEstamos felizes em tê-lo(a) como paciente. Para qualquer dúvida, estamos à disposição.\n\nAtenciosamente,\n{profissional}'
  }
];

export function MensagensProativasTab() {
  const { profissional } = useAuth();
  const queryClient = useQueryClient();
  
  const [editingMensagem, setEditingMensagem] = useState<MensagemProativa | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  
  // Form state
  const [formNome, setFormNome] = useState('');
  const [formConteudo, setFormConteudo] = useState('');
  const [formTrigger, setFormTrigger] = useState('');
  const [formTipo, setFormTipo] = useState('');

  // Buscar mensagens proativas do profissional
  const { data: mensagens = [], isLoading } = useQuery({
    queryKey: ['mensagens-proativas', profissional?.id],
    queryFn: async () => {
      if (!profissional?.id) return [];
      
      const { data, error } = await supabase
        .from('whatsapp_mensagens_proativas')
        .select('*')
        .eq('profissional_id', profissional.id)
        .order('criado_em', { ascending: true });
      
      if (error) throw error;
      return data as MensagemProativa[];
    },
    enabled: !!profissional?.id,
  });

  // Mutation para salvar mensagem
  const salvarMensagem = useMutation({
    mutationFn: async (data: {
      id?: string;
      tipo_mensagem: string;
      nome_mensagem: string;
      conteudo_mensagem: string;
      trigger_descricao: string;
      ativo?: boolean;
    }) => {
      if (!profissional?.id) throw new Error('Profissional não encontrado');

      const payload = {
        profissional_id: profissional.id,
        tipo_mensagem: data.tipo_mensagem,
        nome_mensagem: data.nome_mensagem,
        conteudo_mensagem: data.conteudo_mensagem,
        trigger_descricao: data.trigger_descricao,
        ativo: data.ativo ?? true,
      };

      if (data.id) {
        const { data: result, error } = await supabase
          .from('whatsapp_mensagens_proativas')
          .update(payload)
          .eq('id', data.id)
          .select()
          .single();
        
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('whatsapp_mensagens_proativas')
          .insert(payload)
          .select()
          .single();
        
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      toast.success('Mensagem salva com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['mensagens-proativas'] });
      setIsDialogOpen(false);
      setIsCustomDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Erro ao salvar mensagem:', error);
      toast.error('Erro ao salvar mensagem');
    },
  });

  // Mutation para toggle ativo
  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('whatsapp_mensagens_proativas')
        .update({ ativo })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.ativo ? 'Mensagem ativada!' : 'Mensagem desativada');
      queryClient.invalidateQueries({ queryKey: ['mensagens-proativas'] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    },
  });

  // Mutation para deletar
  const deletarMensagem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whatsapp_mensagens_proativas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Mensagem excluída');
      queryClient.invalidateQueries({ queryKey: ['mensagens-proativas'] });
    },
    onError: (error) => {
      console.error('Erro ao excluir mensagem:', error);
      toast.error('Erro ao excluir mensagem');
    },
  });

  const resetForm = () => {
    setFormNome('');
    setFormConteudo('');
    setFormTrigger('');
    setFormTipo('');
    setEditingMensagem(null);
  };

  const handleEditMensagem = (mensagem: MensagemProativa) => {
    setEditingMensagem(mensagem);
    setFormNome(mensagem.nome_mensagem);
    setFormConteudo(mensagem.conteudo_mensagem);
    setFormTrigger(mensagem.trigger_descricao || '');
    setFormTipo(mensagem.tipo_mensagem);
    setIsDialogOpen(true);
  };

  const handleAddPadrao = (tipo: typeof mensagensPadrao[0]) => {
    // Verificar se já existe uma mensagem desse tipo
    const existe = mensagens.find(m => m.tipo_mensagem === tipo.tipo);
    if (existe) {
      handleEditMensagem(existe);
      return;
    }
    
    setFormNome(tipo.nome);
    setFormConteudo(tipo.conteudoPadrao);
    setFormTrigger(tipo.triggerPadrao);
    setFormTipo(tipo.tipo);
    setEditingMensagem(null);
    setIsDialogOpen(true);
  };

  const handleAddCustom = () => {
    resetForm();
    setFormTipo('personalizada');
    setIsCustomDialogOpen(true);
  };

  const handleSave = () => {
    if (!formNome.trim() || !formConteudo.trim()) {
      toast.error('Preencha o nome e o conteúdo da mensagem');
      return;
    }

    salvarMensagem.mutate({
      id: editingMensagem?.id,
      tipo_mensagem: formTipo,
      nome_mensagem: formNome,
      conteudo_mensagem: formConteudo,
      trigger_descricao: formTrigger,
      ativo: editingMensagem?.ativo ?? true,
    });
  };

  const getMensagemByTipo = (tipo: string) => {
    return mensagens.find(m => m.tipo_mensagem === tipo);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-muted rounded-lg"></div>
        <div className="h-20 bg-muted rounded-lg"></div>
        <div className="h-20 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Mensagens Proativas</h3>
          <p className="text-sm text-muted-foreground">
            Configure mensagens automáticas enviadas via WhatsApp para seus pacientes
          </p>
        </div>
        <Button onClick={handleAddCustom} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Mensagem Personalizada
        </Button>
      </div>

      {/* Info sobre variáveis */}
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Variáveis disponíveis:</strong>{' '}
          <code className="bg-muted px-1 rounded">{'{nome}'}</code> - Nome do paciente,{' '}
          <code className="bg-muted px-1 rounded">{'{clinica}'}</code> - Nome da clínica,{' '}
          <code className="bg-muted px-1 rounded">{'{profissional}'}</code> - Nome do profissional,{' '}
          <code className="bg-muted px-1 rounded">{'{horario}'}</code> - Horário da consulta,{' '}
          <code className="bg-muted px-1 rounded">{'{data}'}</code> - Data da consulta
        </p>
      </div>

      {/* Lista de mensagens padrão */}
      <div className="grid gap-4">
        {mensagensPadrao.map((padrao) => {
          const mensagemExistente = getMensagemByTipo(padrao.tipo);
          const IconComponent = padrao.icone;
          
          return (
            <Card key={padrao.tipo} className={mensagemExistente ? 'border-primary/30' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${mensagemExistente?.ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{padrao.nome}</h4>
                        {mensagemExistente && (
                          <Badge variant={mensagemExistente.ativo ? 'default' : 'secondary'} className="text-xs">
                            {mensagemExistente.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {mensagemExistente?.trigger_descricao || padrao.triggerPadrao}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {mensagemExistente ? (
                      <>
                        <Switch
                          checked={mensagemExistente.ativo}
                          onCheckedChange={(checked) => toggleAtivo.mutate({ id: mensagemExistente.id, ativo: checked })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditMensagem(mensagemExistente)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletarMensagem.mutate(mensagemExistente.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddPadrao(padrao)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mensagens personalizadas */}
      {mensagens.filter(m => m.tipo_mensagem === 'personalizada').length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              Mensagens Personalizadas
            </h4>
            <div className="grid gap-4">
              {mensagens
                .filter(m => m.tipo_mensagem === 'personalizada')
                .map((mensagem) => (
                  <Card key={mensagem.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-2 rounded-lg ${mensagem.ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <MessageSquarePlus className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{mensagem.nome_mensagem}</h4>
                              <Badge variant={mensagem.ativo ? 'default' : 'secondary'} className="text-xs">
                                {mensagem.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {mensagem.trigger_descricao || 'Sem trigger definido'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={mensagem.ativo}
                            onCheckedChange={(checked) => toggleAtivo.mutate({ id: mensagem.id, ativo: checked })}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditMensagem(mensagem)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletarMensagem.mutate(mensagem.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </>
      )}

      {/* Dialog para edição de mensagem padrão */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingMensagem ? 'Editar Mensagem' : 'Configurar Mensagem'}
            </DialogTitle>
            <DialogDescription>
              Configure o conteúdo e o trigger para envio automático
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Mensagem</Label>
              <Input
                id="nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: Mensagem de Aniversário"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger">Trigger (Quando enviar)</Label>
              <Input
                id="trigger"
                value={formTrigger}
                onChange={(e) => setFormTrigger(e.target.value)}
                placeholder="Ex: Enviar no dia do aniversário do paciente"
              />
              <p className="text-xs text-muted-foreground">
                Descreva quando esta mensagem deve ser enviada automaticamente
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conteudo">Conteúdo da Mensagem</Label>
              <Textarea
                id="conteudo"
                value={formConteudo}
                onChange={(e) => setFormConteudo(e.target.value)}
                placeholder="Digite o conteúdo da mensagem..."
                rows={8}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={salvarMensagem.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {salvarMensagem.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para mensagem personalizada */}
      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Mensagem Personalizada</DialogTitle>
            <DialogDescription>
              Crie uma mensagem customizada com seu próprio trigger
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-nome">Nome da Mensagem *</Label>
              <Input
                id="custom-nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: Lembrete de vacina"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-trigger">Trigger (Quando enviar) *</Label>
              <Input
                id="custom-trigger"
                value={formTrigger}
                onChange={(e) => setFormTrigger(e.target.value)}
                placeholder="Ex: Enviar 6 meses após último check-up"
              />
              <p className="text-xs text-muted-foreground">
                Descreva a condição que dispara o envio desta mensagem
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-conteudo">Conteúdo da Mensagem *</Label>
              <Textarea
                id="custom-conteudo"
                value={formConteudo}
                onChange={(e) => setFormConteudo(e.target.value)}
                placeholder="Digite o conteúdo da mensagem..."
                rows={8}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={salvarMensagem.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {salvarMensagem.isPending ? 'Salvando...' : 'Criar Mensagem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
