
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { GerenciarTiposServicos } from './GerenciarTiposServicos';

const formasPagamentoDisponiveis = [
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Transferência Bancária'
];

interface Profissional {
  id: string;
  nome: string;
  especialidade: string;
}

interface ServicosPrecosProps {
  profileData: any;
  setProfileData: (data: any) => void;
  addServicoPreco: () => void;
  removeServicoPreco: (index: number) => void;
  updateServicoPreco: (index: number, field: 'nome' | 'preco', value: string) => void;
  handleFormaPagamentoChange: (forma: string, checked: boolean) => void;
  addPlanoSaude: () => void;
  removePlanoSaude: (index: number) => void;
  updatePlanoSaude: (index: number, value: string) => void;
  // Props para filtro de profissional (admin/secretária)
  podeGerenciarOutros?: boolean;
  profissionais?: Profissional[];
  selectedProfissionalId?: string;
  onProfissionalChange?: (id: string) => void;
}

export function ServicosPrecos({ 
  profileData, 
  setProfileData, 
  addServicoPreco, 
  removeServicoPreco, 
  updateServicoPreco, 
  handleFormaPagamentoChange,
  addPlanoSaude,
  removePlanoSaude,
  updatePlanoSaude,
  podeGerenciarOutros = false,
  profissionais = [],
  selectedProfissionalId = '',
  onProfissionalChange
}: ServicosPrecosProps) {
  const showProfissionalFilter = podeGerenciarOutros && profissionais.length > 0;

  return (
    <div className="space-y-6">
      {/* Novo componente para gerenciar tipos de serviços */}
      <GerenciarTiposServicos />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Configurações de Pagamento</CardTitle>
              <CardDescription>
                Configure as formas de pagamento e planos de saúde aceitos
              </CardDescription>
            </div>
            
            {showProfissionalFilter && (
              <Select
                value={selectedProfissionalId}
                onValueChange={onProfissionalChange}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Selecione profissional" />
                </SelectTrigger>
                <SelectContent>
                  {profissionais.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      👤 {prof.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Planos de Saúde Aceitos</Label>
            <Button type="button" onClick={addPlanoSaude} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
          
          {profileData.planos_saude.map((plano: string, index: number) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Nome do plano de saúde"
                  value={plano}
                  onChange={(e) => updatePlanoSaude(index, e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={() => removePlanoSaude(index)}
                size="sm"
                variant="outline"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
