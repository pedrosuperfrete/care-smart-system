
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreatePaciente, useUpdatePaciente } from '@/hooks/usePacientes';
import { useClinica } from '@/hooks/useClinica';
import { Tables } from '@/integrations/supabase/types';

type Paciente = Tables<'pacientes'>;

const pacienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  data_nascimento: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
  risco: z.enum(['baixo', 'medio', 'alto']).optional(),
});

type PacienteFormData = z.infer<typeof pacienteSchema>;

interface PacienteFormProps {
  paciente?: Paciente;
  onSuccess?: () => void;
}

export function PacienteForm({ paciente, onSuccess }: PacienteFormProps) {
  const { data: clinica } = useClinica();
  const createPaciente = useCreatePaciente();
  const updatePaciente = useUpdatePaciente();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: paciente ? {
      nome: paciente.nome,
      cpf: paciente.cpf,
      data_nascimento: paciente.data_nascimento || '',
      email: paciente.email || '',
      telefone: paciente.telefone || '',
      endereco: paciente.endereco || '',
      observacoes: paciente.observacoes || '',
      risco: paciente.risco || 'baixo',
    } : {
      risco: 'baixo',
    },
  });

  const risco = watch('risco');

  const onSubmit = async (data: PacienteFormData) => {
    if (!clinica) {
      return;
    }

    setIsSubmitting(true);
    try {
      const pacienteData = {
        nome: data.nome,
        cpf: data.cpf,
        clinica_id: clinica.id,
        email: data.email || null,
        data_nascimento: data.data_nascimento || null,
        telefone: data.telefone || null,
        endereco: data.endereco || null,
        observacoes: data.observacoes || null,
        risco: data.risco || 'baixo' as const,
      };

      if (paciente) {
        await updatePaciente.mutateAsync({ id: paciente.id, ...pacienteData });
      } else {
        await createPaciente.mutateAsync(pacienteData);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{paciente ? 'Editar Paciente' : 'Novo Paciente'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Nome completo"
              />
              {errors.nome && (
                <p className="text-sm text-red-600">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                {...register('cpf')}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              {errors.cpf && (
                <p className="text-sm text-red-600">{errors.cpf.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                {...register('data_nascimento')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                {...register('telefone')}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="email@exemplo.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="risco">Nível de Risco</Label>
              <Select value={risco} onValueChange={(value) => setValue('risco', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o risco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              {...register('endereco')}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Observações adicionais sobre o paciente"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Salvando...' : paciente ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
