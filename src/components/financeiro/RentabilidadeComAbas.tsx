import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Target,
  Plus,
  Building2,
  Zap,
  DollarSign,
  Lightbulb
} from 'lucide-react';
import { useCustos, useRentabilidade } from '@/hooks/useCustos';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { SimuladorMeta } from './SimuladorMeta';
import { AnaliseServicoRealizado } from './AnaliseServicoRealizado';
import { useAgendamentos } from '@/hooks/useAgendamentos';

export function RentabilidadeComAbas() {
  const [activeSubTab, setActiveSubTab] = useState('servicos');
  const [periodoSelecionado, setPeriodoSelecionado] = useState('1');
  
  const { custos, isLoading: custosLoading } = useCustos();
  const rentabilidade = useRentabilidade();
  const { data: agendamentos } = useAgendamentos();
  const navigate = useNavigate();
  
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
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="servicos" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Por tipo de serviço
          </TabsTrigger>
          <TabsTrigger value="metas" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servicos" className="mt-4">
          {rentabilidade.rentabilidadePorServico.length > 0 ? (
            <AnaliseServicoRealizado 
              rentabilidade={rentabilidade}
              agendamentos={agendamentos}
              periodoSelecionado={periodoSelecionado}
              setPeriodoSelecionado={setPeriodoSelecionado}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum serviço cadastrado</h3>
                <p className="text-muted-foreground">
                  Cadastre seus serviços em Configurações → Tipos de Serviços para ver a rentabilidade de cada um.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metas" className="mt-4">
          <SimuladorMeta />
        </TabsContent>
      </Tabs>
    </div>
  );
}
