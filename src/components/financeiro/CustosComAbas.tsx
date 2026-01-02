import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, CheckCircle } from 'lucide-react';
import { CadastroCustos } from './CadastroCustos';
import { ConfirmacaoCustosMensal } from './ConfirmacaoCustosMensal';

export function CustosComAbas() {
  const [activeSubTab, setActiveSubTab] = useState('adicionar');

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
      <TabsList>
        <TabsTrigger value="adicionar" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Custos
        </TabsTrigger>
        <TabsTrigger value="confirmar" className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Confirmar Custos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="adicionar" className="mt-4">
        <CadastroCustos />
      </TabsContent>

      <TabsContent value="confirmar" className="mt-4">
        <ConfirmacaoCustosMensal />
      </TabsContent>
    </Tabs>
  );
}
