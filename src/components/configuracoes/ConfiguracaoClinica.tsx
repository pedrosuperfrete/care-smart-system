
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Info, Percent } from 'lucide-react';
import { useClinica } from '@/hooks/useClinica';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ConfiguracaoClinica() {
  const { data: clinica, refetch } = useClinica();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    taxa_imposto: 0
  });

  useEffect(() => {
    if (clinica) {
      setFormData({
        nome: clinica.nome || '',
        cnpj: clinica.cnpj || '',
        endereco: clinica.endereco || '',
        taxa_imposto: Number((clinica as any).taxa_imposto) || 0
      });
    }
  }, [clinica]);

  const handleSave = async () => {
    if (!clinica) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('clinicas')
        .update({
          nome: formData.nome,
          cnpj: formData.cnpj,
          endereco: formData.endereco || null,
          taxa_imposto: formData.taxa_imposto || 0
        })
        .eq('id', clinica.id);

      if (error) throw error;

      toast.success('Configurações da clínica salvas com sucesso!');
      refetch();
    } catch (error: any) {
      toast.error('Erro ao salvar configurações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const temCnpj = formData.cnpj && formData.cnpj.replace(/\D/g, '').length >= 14;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Clínica</CardTitle>
        <CardDescription>
          Configure os dados básicos da sua clínica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da Clínica</Label>
            <Input 
              placeholder="Nome da clínica" 
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input 
              placeholder="00.000.000/0001-00" 
              value={formData.cnpj}
              onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Endereço</Label>
            <Textarea 
              placeholder="Endereço completo da clínica" 
              value={formData.endereco}
              onChange={(e) => setFormData({...formData, endereco: e.target.value})}
            />
          </div>

          {temCnpj && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Taxa de Imposto (%)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Percentual de imposto pago sobre o faturamento (ex: Simples Nacional pode ser entre 4% e 19%). Será usado para calcular o lucro líquido após impostos.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="relative">
                <Input 
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="Ex: 6" 
                  value={formData.taxa_imposto || ''}
                  onChange={(e) => setFormData({...formData, taxa_imposto: Number(e.target.value) || 0})}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Este percentual será descontado do faturamento para calcular seu lucro líquido real.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
