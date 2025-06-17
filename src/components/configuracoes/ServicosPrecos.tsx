
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';

const formasPagamentoDisponiveis = [
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Transferência Bancária'
];

interface ServicosPrecosProps {
  profileData: any;
  setProfileData: (data: any) => void;
  addServicoPreco: () => void;
  removeServicoPreco: (index: number) => void;
  updateServicoPreco: (index: number, field: 'nome' | 'preco', value: string) => void;
  handleFormaPagamentoChange: (forma: string, checked: boolean) => void;
}

export function ServicosPrecos({ 
  profileData, 
  setProfileData, 
  addServicoPreco, 
  removeServicoPreco, 
  updateServicoPreco, 
  handleFormaPagamentoChange 
}: ServicosPrecosProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Serviços e Preços</CardTitle>
        <CardDescription>
          Configure os serviços que você oferece e seus respectivos preços
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Serviços com Preços</Label>
            <Button type="button" onClick={addServicoPreco} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
          
          {profileData.servicos_precos.map((servico: any, index: number) => (
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
          <Label>Formas de Pagamento Aceitas</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {formasPagamentoDisponiveis.map((forma) => (
              <div key={forma} className="flex items-center space-x-2">
                <Checkbox
                  id={forma}
                  checked={profileData.formas_pagamento.includes(forma)}
                  onCheckedChange={(checked) => handleFormaPagamentoChange(forma, !!checked)}
                />
                <Label
                  htmlFor={forma}
                  className="text-sm font-normal cursor-pointer"
                >
                  {forma}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Planos de Saúde Aceitos</Label>
          <Textarea
            value={profileData.planos_saude}
            onChange={(e) => setProfileData({ ...profileData, planos_saude: e.target.value })}
            placeholder="Lista os planos de saúde que você aceita (separados por vírgula)"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
