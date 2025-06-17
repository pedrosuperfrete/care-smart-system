
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Onboarding() {
  const { profissional, updateProfissional } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: profissional?.nome || '',
    especialidade: profissional?.especialidade || '',
    crm_cro: profissional?.crm_cro || '',
    telefone: profissional?.telefone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfissional(formData);
      toast.success('Perfil completado com sucesso!');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            Complete seu Perfil
          </CardTitle>
          <CardDescription className="text-center">
            Preencha seus dados profissionais para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="especialidade">Especialidade *</Label>
              <Input
                id="especialidade"
                value={formData.especialidade}
                onChange={(e) => handleChange('especialidade', e.target.value)}
                placeholder="Ex: Cardiologia, Odontologia"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crm_cro">CRM/CRO *</Label>
              <Input
                id="crm_cro"
                value={formData.crm_cro}
                onChange={(e) => handleChange('crm_cro', e.target.value)}
                placeholder="Ex: CRM 12345"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : 'Completar Cadastro'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
