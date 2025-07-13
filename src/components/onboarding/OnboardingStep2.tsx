
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

const formasPagamentoDisponiveis = [
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Transferência Bancária'
];

interface ServicoPreco {
  nome: string;
  preco: string;
}

interface OnboardingStep2Props {
  data: {
    nome_clinica: string;
    cnpj_clinica: string;
    endereco_clinica: string;
    horarios_atendimento: string;
    servicos_precos: ServicoPreco[];
    formas_pagamento: string[];
    planos_saude: string;
  };
  onDataChange: (data: any) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

export function OnboardingStep2({ data, onDataChange, onSubmit, onBack, loading }: OnboardingStep2Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!data.nome_clinica.trim()) {
      newErrors.nome_clinica = 'Nome da clínica é obrigatório';
    }

    if (!data.cnpj_clinica.trim()) {
      newErrors.cnpj_clinica = 'CNPJ da clínica é obrigatório';
    }

    if (!data.horarios_atendimento.trim()) {
      newErrors.horarios_atendimento = 'Horários de atendimento são obrigatórios';
    }

    if (data.servicos_precos.length === 0) {
      newErrors.servicos_precos = 'Adicione pelo menos um serviço com preço';
    }

    if (data.formas_pagamento.length === 0) {
      newErrors.formas_pagamento = 'Selecione pelo menos uma forma de pagamento';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit();
    }
  };

  const addServicoPreco = () => {
    onDataChange({
      ...data,
      servicos_precos: [...data.servicos_precos, { nome: '', preco: '' }]
    });
  };

  const removeServicoPreco = (index: number) => {
    const newServicos = data.servicos_precos.filter((_, i) => i !== index);
    onDataChange({ ...data, servicos_precos: newServicos });
  };

  const updateServicoPreco = (index: number, field: 'nome' | 'preco', value: string) => {
    const newServicos = [...data.servicos_precos];
    newServicos[index][field] = value;
    onDataChange({ ...data, servicos_precos: newServicos });
  };

  const handleFormaPagamentoChange = (forma: string, checked: boolean) => {
    const newFormas = checked 
      ? [...data.formas_pagamento, forma]
      : data.formas_pagamento.filter(f => f !== forma);
    
    onDataChange({ ...data, formas_pagamento: newFormas });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Complete seu Perfil - Etapa 2 de 2</CardTitle>
        <CardDescription>
          Últimas informações para finalizar seu cadastro
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nome_clinica">Nome da Clínica *</Label>
            <Input
              id="nome_clinica"
              value={data.nome_clinica}
              onChange={(e) => onDataChange({ ...data, nome_clinica: e.target.value })}
              placeholder="Nome que será exibido aos pacientes"
            />
            {errors.nome_clinica && (
              <p className="text-sm text-red-600">{errors.nome_clinica}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj_clinica">CNPJ da Clínica *</Label>
              <Input
                id="cnpj_clinica"
                value={data.cnpj_clinica}
                onChange={(e) => onDataChange({ ...data, cnpj_clinica: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
              {errors.cnpj_clinica && (
                <p className="text-sm text-red-600">{errors.cnpj_clinica}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco_clinica">Endereço da Clínica</Label>
              <Input
                id="endereco_clinica"
                value={data.endereco_clinica}
                onChange={(e) => onDataChange({ ...data, endereco_clinica: e.target.value })}
                placeholder="Endereço completo (opcional)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="horarios_atendimento">Horários de Atendimento *</Label>
            <Textarea
              id="horarios_atendimento"
              value={data.horarios_atendimento}
              onChange={(e) => onDataChange({ ...data, horarios_atendimento: e.target.value })}
              placeholder="Ex: Segunda a Sexta: 8h às 18h&#10;Sábado: 8h às 12h"
              rows={3}
            />
            {errors.horarios_atendimento && (
              <p className="text-sm text-red-600">{errors.horarios_atendimento}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Serviços com Preços *</Label>
              <Button type="button" onClick={addServicoPreco} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
            
            {data.servicos_precos.map((servico, index) => (
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
            
            {errors.servicos_precos && (
              <p className="text-sm text-red-600">{errors.servicos_precos}</p>
            )}
          </div>

          <div className="space-y-4">
            <Label>Formas de Pagamento Aceitas *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formasPagamentoDisponiveis.map((forma) => (
                <div key={forma} className="flex items-center space-x-2">
                  <Checkbox
                    id={forma}
                    checked={data.formas_pagamento.includes(forma)}
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
            {errors.formas_pagamento && (
              <p className="text-sm text-red-600">{errors.formas_pagamento}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="planos_saude">Planos de Saúde Aceitos</Label>
            <Textarea
              id="planos_saude"
              value={data.planos_saude}
              onChange={(e) => onDataChange({ ...data, planos_saude: e.target.value })}
              placeholder="Lista os planos de saúde que você aceita (opcional)"
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button type="button" onClick={onBack} variant="outline" className="flex-1">
              Voltar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Salvando...' : 'Finalizar Cadastro'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
