import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  CheckCircle, 
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ErroSistema {
  id: string;
  tipo: string;
  mensagem_erro: string;
  data_ocorrencia: string;
  resolvido: boolean;
  tentativas_retry: number;
  user_id?: string;
  profissional_id?: string;
  entidade_id?: string;
}

export function LogsErrosList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const queryClient = useQueryClient();

  const { data: erros = [], isLoading } = useQuery({
    queryKey: ['erros-sistema', searchTerm, filterTipo, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('erros_sistema')
        .select('*')
        .order('data_ocorrencia', { ascending: false })
        .limit(100);

      // Filtrar por tipo
      if (filterTipo !== 'all') {
        query = query.eq('tipo', filterTipo);
      }

      // Filtrar por status
      if (filterStatus !== 'all') {
        query = query.eq('resolvido', filterStatus === 'resolved');
      }

      // Buscar por termo
      if (searchTerm) {
        query = query.or(`mensagem_erro.ilike.%${searchTerm}%,tipo.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as ErroSistema[];
    },
  });

  const marcarResolvidoMutation = useMutation({
    mutationFn: async ({ id, resolvido }: { id: string; resolvido: boolean }) => {
      const { error } = await supabase
        .from('erros_sistema')
        .update({ resolvido })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erros-sistema'] });
      toast.success('Status do erro atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  // Obter tipos únicos de erro
  const tiposUnicos = Array.from(new Set(erros.map(erro => erro.tipo))).sort();

  const getStatusBadge = (resolvido: boolean) => {
    return resolvido ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Resolvido
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const cores = {
      'AUTH_ERROR': 'bg-orange-100 text-orange-800',
      'SUPABASE_ERROR': 'bg-blue-100 text-blue-800',
      'VALIDATION_ERROR': 'bg-purple-100 text-purple-800',
      'JAVASCRIPT_ERROR': 'bg-red-100 text-red-800',
      'REACT_ERROR_BOUNDARY': 'bg-pink-100 text-pink-800',
      'NAVIGATION_ERROR': 'bg-indigo-100 text-indigo-800',
    };

    const cor = cores[tipo as keyof typeof cores] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge variant="outline" className={cor}>
        {tipo.replace('_', ' ')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Carregando logs de erro...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar erros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo de erro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {tiposUnicos.map(tipo => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="resolved">Resolvidos</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            {erros.length} erro(s) encontrado(s)
          </div>
        </div>
      </Card>

      {/* Lista de Erros */}
      <div className="space-y-3">
        {erros.map((erro) => (
          <Card key={erro.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {getTipoBadge(erro.tipo)}
                  {getStatusBadge(erro.resolvido)}
                  {erro.tentativas_retry > 0 && (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      {erro.tentativas_retry} tentativas
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground break-words">
                  <strong>Mensagem:</strong> {erro.mensagem_erro}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {(() => {
                      const d = new Date(erro.data_ocorrencia);
                      const hours = d.getHours().toString().padStart(2, '0');
                      const minutes = d.getMinutes().toString().padStart(2, '0');
                      const timeFormatted = minutes === '00' ? `${hours}h` : `${hours}h${minutes}`;
                      return format(d, "dd/MM/yyyy", { locale: ptBR }) + ` às ${timeFormatted}`;
                    })()}
                  </div>
                  {erro.user_id && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      ID: {erro.user_id.substring(0, 8)}...
                    </div>
                  )}
                </div>

                {erro.entidade_id && (
                  <p className="text-xs text-muted-foreground">
                    <strong>Entidade:</strong> {erro.entidade_id}
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => marcarResolvidoMutation.mutate({ 
                  id: erro.id, 
                  resolvido: !erro.resolvido 
                })}
                disabled={marcarResolvidoMutation.isPending}
              >
                {erro.resolvido ? 'Marcar Pendente' : 'Marcar Resolvido'}
              </Button>
            </div>
          </Card>
        ))}

        {erros.length === 0 && (
          <Card className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum erro encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterTipo !== 'all' || filterStatus !== 'all'
                ? 'Tente ajustar os filtros para encontrar outros erros.'
                : 'Ótimo! Não há erros registrados no sistema.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}