import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Calculator,
  Building2,
  Zap,
  Lightbulb,
  Info,
  Calendar
} from 'lucide-react';
import { useCustos, useRentabilidade } from '@/hooks/useCustos';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { SimuladorMeta } from './SimuladorMeta';
import { AnaliseServicoRealizado } from './AnaliseServicoRealizado';
import { useAgendamentos } from '@/hooks/useAgendamentos';

export function Rentabilidade() {
  const { custos, isLoading: custosLoading } = useCustos();
  const rentabilidade = useRentabilidade();
  const { data: agendamentos } = useAgendamentos();
  const navigate = useNavigate();
  const [periodoSelecionado, setPeriodoSelecionado] = useState('1');
  
  const custosCadastrados = custos.length > 0;

  if (custosLoading) {
    return <div className="text-center py-8">Carregando dados...</div>;
  }

  if (!custosCadastrados) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Comece a entender sua rentabilidade</h3>
            <p className="text-muted-foreground mb-4">
              Cadastre seus custos fixos e variáveis para descobrir quanto você realmente ganha por atendimento.
            </p>
            <Button onClick={() => navigate('/app/financeiro?tab=custos')}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Custos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Custos Fixos Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {formatCurrency(rentabilidade.custoFixoTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Despesas que você tem todo mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Custo por Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {formatCurrency(rentabilidade.custoVariavelPorAtendimento)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Materiais e insumos por consulta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {formatCurrency(rentabilidade.ticketMedio)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor médio dos seus serviços
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Simulador de Meta */}
      <SimuladorMeta />

      {/* Análise por Serviço */}
      {rentabilidade.rentabilidadePorServico.length > 0 && (
        <AnaliseServicoRealizado 
          rentabilidade={rentabilidade}
          agendamentos={agendamentos}
          periodoSelecionado={periodoSelecionado}
          setPeriodoSelecionado={setPeriodoSelecionado}
        />
      )}

      {rentabilidade.rentabilidadePorServico.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-8">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum serviço cadastrado</h3>
            <p className="text-muted-foreground">
              Cadastre seus serviços em Configurações → Tipos de Serviços para ver a rentabilidade de cada um.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
