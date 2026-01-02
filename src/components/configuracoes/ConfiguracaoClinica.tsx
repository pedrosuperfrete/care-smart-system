
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { useClinica } from '@/hooks/useClinica';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function ConfiguracaoClinica() {
  const { data: clinica, refetch } = useClinica();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    endereco: ''
  });

  useEffect(() => {
    if (clinica) {
      setFormData({
        nome: clinica.nome || '',
        cnpj: clinica.cnpj || '',
        endereco: clinica.endereco || ''
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
          endereco: formData.endereco || null
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
