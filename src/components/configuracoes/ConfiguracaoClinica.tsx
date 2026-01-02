
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, CreditCard } from 'lucide-react';
import { useClinica } from '@/hooks/useClinica';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function ConfiguracaoClinica() {
  const { data: clinica, refetch } = useClinica();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    taxa_cartao_credito: 0,
    taxa_cartao_debito: 0
  });

  useEffect(() => {
    console.log('ConfiguracaoClinica - clinica data:', clinica);
    if (clinica) {
      setFormData({
        nome: clinica.nome || '',
        cnpj: clinica.cnpj || '',
        endereco: clinica.endereco || '',
        taxa_cartao_credito: clinica.taxa_cartao_credito || 0,
        taxa_cartao_debito: clinica.taxa_cartao_debito || 0
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
          taxa_cartao_credito: formData.taxa_cartao_credito,
          taxa_cartao_debito: formData.taxa_cartao_debito
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
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">Taxas de Cartão</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure as taxas cobradas pelas maquininhas para descontar automaticamente do fluxo de caixa.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Taxa Cartão de Crédito (%)</Label>
              <Input 
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="Ex: 3.5" 
                value={formData.taxa_cartao_credito}
                onChange={(e) => setFormData({...formData, taxa_cartao_credito: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <Label>Taxa Cartão de Débito (%)</Label>
              <Input 
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="Ex: 1.5" 
                value={formData.taxa_cartao_debito}
                onChange={(e) => setFormData({...formData, taxa_cartao_debito: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>
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
