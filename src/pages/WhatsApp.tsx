import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, Phone, User, MessageSquare, Clock, CheckCheck, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: Date;
  type: 'sent' | 'received';
  status: 'sent' | 'delivered' | 'read';
  paciente_id?: string;
}

interface WhatsAppConversation {
  id: string;
  paciente_nome: string;
  paciente_telefone: string;
  paciente_avatar?: string;
  last_message: string;
  last_message_time: Date;
  unread_count: number;
  messages: WhatsAppMessage[];
}

const WhatsApp = () => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data - em produção viria do Supabase
  useEffect(() => {
    const mockData: WhatsAppConversation[] = [
      {
        id: "1",
        paciente_nome: "Maria Silva",
        paciente_telefone: "(11) 99999-1234",
        last_message: "Obrigada pela consulta de hoje, Dr!",
        last_message_time: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        unread_count: 0,
        messages: [
          {
            id: "1",
            from: "clinic",
            to: "patient",
            message: "Olá Maria! Sua consulta está confirmada para hoje às 14:00h.",
            timestamp: new Date(Date.now() - 1000 * 60 * 120),
            type: 'sent',
            status: 'read'
          },
          {
            id: "2",
            from: "patient",
            to: "clinic",
            message: "Perfeito! Estarei lá no horário.",
            timestamp: new Date(Date.now() - 1000 * 60 * 90),
            type: 'received',
            status: 'read'
          },
          {
            id: "3",
            from: "patient",
            to: "clinic",
            message: "Obrigada pela consulta de hoje, Dr!",
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            type: 'received',
            status: 'read'
          }
        ]
      },
      {
        id: "2",
        paciente_nome: "João Santos",
        paciente_telefone: "(11) 98888-5678",
        last_message: "Preciso reagendar minha consulta",
        last_message_time: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        unread_count: 2,
        messages: [
          {
            id: "4",
            from: "patient",
            to: "clinic",
            message: "Boa tarde! Preciso reagendar minha consulta de amanhã.",
            timestamp: new Date(Date.now() - 1000 * 60 * 70),
            type: 'received',
            status: 'read'
          },
          {
            id: "5",
            from: "patient",
            to: "clinic",
            message: "Preciso reagendar minha consulta",
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            type: 'received',
            status: 'read'
          }
        ]
      },
      {
        id: "3",
        paciente_nome: "Ana Costa",
        paciente_telefone: "(11) 97777-9012",
        last_message: "Obrigado pelo lembrete!",
        last_message_time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        unread_count: 0,
        messages: [
          {
            id: "6",
            from: "clinic",
            to: "patient",
            message: "Lembrete: Sua consulta é amanhã às 09:00h. Confirme sua presença.",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
            type: 'sent',
            status: 'read'
          },
          {
            id: "7",
            from: "patient",
            to: "clinic",
            message: "Obrigado pelo lembrete!",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            type: 'received',
            status: 'read'
          }
        ]
      }
    ];

    setTimeout(() => {
      setConversations(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv.paciente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.paciente_telefone.includes(searchTerm)
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const newMsg: WhatsAppMessage = {
      id: Date.now().toString(),
      from: "clinic",
      to: "patient",
      message: newMessage,
      timestamp: new Date(),
      type: 'sent',
      status: 'sent'
    };

    // Atualizar a conversa selecionada
    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMsg],
      last_message: newMessage,
      last_message_time: new Date()
    };

    setSelectedConversation(updatedConversation);

    // Atualizar a lista de conversas
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation.id ? updatedConversation : conv
      )
    );

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatMessageTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    if (minutes === '00') {
      return `${hours}h`;
    }
    return `${hours}h${minutes}`;
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      if (minutes === '00') {
        return `${hours}h`;
      }
      return `${hours}h${minutes}`;
    } else {
      return format(date, "dd/MM", { locale: ptBR });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex">
      {/* Lista de Conversas */}
      <div className="w-1/3 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3 mb-4">
            <MessageSquare className="w-6 h-6 text-green-600" />
            <h1 className="text-xl font-bold text-foreground">WhatsApp</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <Card 
                key={conversation.id}
                className={`mb-2 cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedConversation?.id === conversation.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conversation.paciente_avatar} />
                      <AvatarFallback className="bg-green-100 text-green-600">
                        {conversation.paciente_nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground truncate">
                          {conversation.paciente_nome}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {formatLastMessageTime(conversation.last_message_time)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message}
                        </p>
                        {conversation.unread_count > 0 && (
                          <Badge variant="default" className="bg-green-600 text-white text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {conversation.paciente_telefone}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header da Conversa */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedConversation.paciente_avatar} />
                  <AvatarFallback className="bg-green-100 text-green-600">
                    {selectedConversation.paciente_nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-foreground">
                    {selectedConversation.paciente_nome}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.paciente_telefone}
                  </p>
                </div>
                <div className="ml-auto">
                  <Button variant="outline" size="sm">
                    <Phone className="w-4 h-4 mr-2" />
                    Ligar
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'sent'
                          ? 'bg-green-600 text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <div className={`flex items-center justify-end space-x-1 mt-1 ${
                        message.type === 'sent' ? 'text-green-100' : 'text-muted-foreground'
                      }`}>
                        <span className="text-xs">
                          {formatMessageTime(message.timestamp)}
                        </span>
                        {message.type === 'sent' && getMessageStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input de Nova Mensagem */}
            <div className="p-4 border-t border-border">
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 min-h-[40px] max-h-32 resize-none"
                  rows={1}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-muted-foreground">
                Escolha uma conversa para começar a trocar mensagens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsApp;