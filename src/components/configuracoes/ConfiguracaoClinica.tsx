
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';

export function ConfiguracaoClinica() {
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
            <Input placeholder="Nome da clínica" />
          </div>

          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input placeholder="00.000.000/0001-00" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Endereço</Label>
            <Textarea placeholder="Endereço completo da clínica" />
          </div>

          <div className="space-y-2">
            <Label>Chave PIX</Label>
            <Input placeholder="Chave PIX para recebimentos" />
          </div>

          <div className="space-y-2">
            <Label>Conta Bancária</Label>
            <Input placeholder="Dados da conta bancária" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
