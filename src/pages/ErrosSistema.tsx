import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, RefreshCw, Filter } from "lucide-react";
import { useErrosSistema } from "@/hooks/useErrosSistema";
import { AlertErroSistema } from "@/components/ui/alert-erro-sistema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ErrosSistema() {
  const { data: erros, isLoading, refetch } = useErrosSistema();
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const errosFiltrados = erros?.filter(erro => 
    filtroTipo === 'todos' || erro.tipo === filtroTipo
  ) || [];

  const errosPorTipo = {
    calendar_sync: erros?.filter(e => e.tipo === 'calendar_sync').length || 0,
    pagamento: erros?.filter(e => e.tipo === 'pagamento').length || 0,
    sistema: erros?.filter(e => e.tipo === 'sistema').length || 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Erros do Sistema</h1>
          <p className="text-muted-foreground">
            Monitore e resolva erros de sincronização e pagamentos
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Erros do Sistema</h1>
          <p className="text-muted-foreground">
            Monitore e resolva erros de sincronização e pagamentos
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Total de Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{erros?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Google Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {errosPorTipo.calendar_sync}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {errosPorTipo.pagamento}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {errosPorTipo.sistema}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de erros */}
      <Card>
        <CardHeader>
          <CardTitle>Erros Pendentes</CardTitle>
          <CardDescription>
            Lista de todos os erros não resolvidos ordenados por data de ocorrência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filtroTipo} onValueChange={setFiltroTipo} className="space-y-4">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="calendar_sync">Google Calendar</TabsTrigger>
              <TabsTrigger value="pagamento">Pagamentos</TabsTrigger>
              <TabsTrigger value="sistema">Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value={filtroTipo} className="space-y-4">
              {errosFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Nenhum erro encontrado</h3>
                  <p className="text-muted-foreground">
                    {filtroTipo === 'todos' 
                      ? 'Não há erros pendentes no sistema.'
                      : `Não há erros do tipo "${filtroTipo}" pendentes.`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {errosFiltrados.map((erro) => (
                    <AlertErroSistema
                      key={erro.id}
                      erro={erro}
                      variant="card"
                      showActions={true}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}