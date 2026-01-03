import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, FileText, Info } from 'lucide-react';
import { useClinica } from '@/hooks/useClinica';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ConfiguracaoNotaFiscal() {
  const { data: clinica, refetch } = useClinica();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nf_cidade_emissao: '',
    nf_inscricao_municipal: '',
    nf_regime_tributario: 'simples',
    nf_codigo_servico: '',
    nf_descricao_servico: ''
  });

  useEffect(() => {
    if (clinica) {
      const clinicaData = clinica as any;
      setFormData({
        nf_cidade_emissao: clinicaData.nf_cidade_emissao || '',
        nf_inscricao_municipal: clinicaData.nf_inscricao_municipal || '',
        nf_regime_tributario: clinicaData.nf_regime_tributario || 'simples',
        nf_codigo_servico: clinicaData.nf_codigo_servico || '',
        nf_descricao_servico: clinicaData.nf_descricao_servico || ''
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
          nf_cidade_emissao: formData.nf_cidade_emissao || null,
          nf_inscricao_municipal: formData.nf_inscricao_municipal || null,
          nf_regime_tributario: formData.nf_regime_tributario || 'simples',
          nf_codigo_servico: formData.nf_codigo_servico || null,
          nf_descricao_servico: formData.nf_descricao_servico || null
        } as any)
        .eq('id', clinica.id);

      if (error) throw error;

      toast.success('Configurações de Nota Fiscal salvas com sucesso!');
      refetch();
    } catch (error: any) {
      toast.error('Erro ao salvar configurações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Verificar se a clínica tem CNPJ
  const temCnpj = clinica?.cnpj && clinica.cnpj.replace(/\D/g, '').length >= 14;

  if (!temCnpj) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Emissão de Nota Fiscal
          </CardTitle>
          <CardDescription>
            Configure os dados para emissão de notas fiscais pelo Donee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Para configurar a emissão de notas fiscais, primeiro preencha o <strong>CNPJ da clínica</strong> nas informações acima.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="config-nota-fiscal">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Emissão de Nota Fiscal
        </CardTitle>
        <CardDescription>
          Configure os dados para emissão de notas fiscais pelo Donee
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cidade de Emissão</Label>
            <Select 
              value={formData.nf_cidade_emissao} 
              onValueChange={(value) => setFormData({...formData, nf_cidade_emissao: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RJ">Rio de Janeiro (RJ)</SelectItem>
                <SelectItem value="SP">São Paulo (SP)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Inscrição Municipal
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Número de inscrição municipal da sua empresa na prefeitura</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input 
              placeholder="Ex: 12345678" 
              value={formData.nf_inscricao_municipal}
              onChange={(e) => setFormData({...formData, nf_inscricao_municipal: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>Regime Tributário</Label>
            <Select 
              value={formData.nf_regime_tributario} 
              onValueChange={(value) => setFormData({...formData, nf_regime_tributario: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o regime" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simples">Simples Nacional</SelectItem>
                <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                <SelectItem value="lucro_real">Lucro Real</SelectItem>
                <SelectItem value="mei">MEI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Código do Serviço
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Código do serviço conforme a lista de serviços da sua prefeitura (LC 116)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input 
              placeholder="Ex: 4.03" 
              value={formData.nf_codigo_servico}
              onChange={(e) => setFormData({...formData, nf_codigo_servico: e.target.value})}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="flex items-center gap-2">
              Descrição Padrão do Serviço
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Descrição que aparecerá nas notas fiscais emitidas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Textarea 
              placeholder="Ex: Serviços de consulta e atendimento em saúde" 
              value={formData.nf_descricao_servico}
              onChange={(e) => setFormData({...formData, nf_descricao_servico: e.target.value})}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Salvando...' : 'Salvar Configurações de NF'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
