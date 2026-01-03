import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, FileText, Info, Percent } from 'lucide-react';
import { useClinica } from '@/hooks/useClinica';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ConfiguracaoNotaFiscal() {
  const { data: clinica, refetch } = useClinica();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Dados da clínica
    nome: '',
    cnpj: '',
    endereco: '',
    taxa_imposto: 0,
    // Dados da NF
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
        nome: clinica.nome || '',
        cnpj: clinica.cnpj || '',
        endereco: clinica.endereco || '',
        taxa_imposto: Number(clinicaData.taxa_imposto) || 0,
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

    const payload = {
      nome: formData.nome.trim(),
      cnpj: formData.cnpj.trim(),
      endereco: formData.endereco?.trim() ? formData.endereco.trim() : null,
      taxa_imposto: formData.taxa_imposto || 0,
      nf_cidade_emissao: formData.nf_cidade_emissao || null,
      nf_inscricao_municipal: formData.nf_inscricao_municipal?.trim() ? formData.nf_inscricao_municipal.trim() : null,
      nf_regime_tributario: formData.nf_regime_tributario || 'simples',
      // Importante: este código deve ser o da LC 116 / prefeitura (ex: 4.03), não CNAE
      nf_codigo_servico: formData.nf_codigo_servico?.trim() ? formData.nf_codigo_servico.trim() : null,
      nf_descricao_servico: formData.nf_descricao_servico?.trim() ? formData.nf_descricao_servico.trim() : null,
    };

    setLoading(true);
    try {
      const { error } = await supabase
        .from('clinicas')
        .update(payload as any)
        .eq('id', clinica.id);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
      refetch();
    } catch (error: any) {
      toast.error('Erro ao salvar configurações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const temCnpj = formData.cnpj && formData.cnpj.replace(/\D/g, '').length >= 14;

  return (
    <Card id="config-nota-fiscal">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Dados para Emissão de Nota Fiscal
        </CardTitle>
        <CardDescription>
          Configure os dados da clínica e informações para emissão de notas fiscais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dados básicos da clínica */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Dados da Clínica</h3>
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
        </div>

        {/* Configurações de NF - só aparece se tem CNPJ */}
        {temCnpj && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground">Configurações de Nota Fiscal</h3>
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
                        <p>Código do serviço conforme a lista de serviços da sua prefeitura (LC 116). Ex: 4.03. (Não é CNAE)</p>
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
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
