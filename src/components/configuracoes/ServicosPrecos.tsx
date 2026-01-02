
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, CreditCard, Save } from 'lucide-react';
import { GerenciarTiposServicos } from './GerenciarTiposServicos';
import { useClinica } from '@/hooks/useClinica';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const { data: clinica, refetch: refetchClinica } = useClinica();
  const [taxaCredito, setTaxaCredito] = useState<number>(0);
  const [taxaDebito, setTaxaDebito] = useState<number>(0);
  const [savingTaxas, setSavingTaxas] = useState(false);

  const showProfissionalFilter = podeGerenciarOutros && profissionais.length > 0;
  
  const aceitaCredito = profileData.formas_pagamento.includes('Cartão de Crédito');
  const aceitaDebito = profileData.formas_pagamento.includes('Cartão de Débito');
  const mostrarTaxas = aceitaCredito || aceitaDebito;

  useEffect(() => {
    if (clinica) {
      setTaxaCredito(clinica.taxa_cartao_credito || 0);
      setTaxaDebito(clinica.taxa_cartao_debito || 0);
    }
  }, [clinica]);

  const handleSaveTaxas = async () => {
    if (!clinica) return;
    
    setSavingTaxas(true);
    try {
      const { error } = await supabase
        .from('clinicas')
        .update({
          taxa_cartao_credito: taxaCredito,
          taxa_cartao_debito: taxaDebito
        })
        .eq('id', clinica.id);

      if (error) throw error;
      
      toast.success('Taxas de cartão salvas com sucesso!');
      refetchClinica();
    } catch (error: any) {
      toast.error('Erro ao salvar taxas: ' + error.message);
    } finally {
      setSavingTaxas(false);
    }
  };

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

        {/* Taxas de Cartão - só aparece se aceita cartão */}
        {mostrarTaxas && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">Taxas de Cartão</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure os percentuais cobrados pelas maquininhas para desconto automático no fluxo de caixa.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aceitaCredito && (
                <div className="space-y-2">
                  <Label htmlFor="taxa-credito">Taxa Crédito (%)</Label>
                  <Input 
                    id="taxa-credito"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="Ex: 3.5" 
                    value={taxaCredito}
                    onChange={(e) => setTaxaCredito(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
              {aceitaDebito && (
                <div className="space-y-2">
                  <Label htmlFor="taxa-debito">Taxa Débito (%)</Label>
                  <Input 
                    id="taxa-debito"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="Ex: 1.5" 
                    value={taxaDebito}
                    onChange={(e) => setTaxaDebito(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button 
                size="sm" 
                onClick={handleSaveTaxas} 
                disabled={savingTaxas}
              >
                <Save className="h-4 w-4 mr-2" />
                {savingTaxas ? 'Salvando...' : 'Salvar Taxas'}
              </Button>
            </div>
          </div>
        )}

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
