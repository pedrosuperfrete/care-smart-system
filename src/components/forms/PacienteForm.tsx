
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCreatePaciente, useUpdatePaciente } from '@/hooks/usePacientes';
import { LimiteAssinaturaModal } from '@/components/modals/LimiteAssinaturaModal';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';

type Paciente = Tables<'pacientes'>;

const pacienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  data_nascimento: z.date().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
  tipo_paciente: z.enum(['novo', 'recorrente', 'antigo']).optional(),
});

type PacienteFormData = z.infer<typeof pacienteSchema>;

interface PacienteFormProps {
  paciente?: Paciente;
  onSuccess?: () => void;
}

export function PacienteForm({ paciente, onSuccess }: PacienteFormProps) {
  const { clinicaAtual } = useAuth();
  const createPaciente = useCreatePaciente();
  const updatePaciente = useUpdatePaciente();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLimiteModal, setShowLimiteModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: paciente ? {
      nome: paciente.nome,
      cpf: paciente.cpf,
      data_nascimento: paciente.data_nascimento ? new Date(paciente.data_nascimento) : undefined,
      email: paciente.email || '',
      telefone: paciente.telefone || '',
      endereco: paciente.endereco || '',
      observacoes: paciente.observacoes || '',
      tipo_paciente: paciente.tipo_paciente || 'novo',
    } : {
      tipo_paciente: 'novo',
    },
  });

  const tipoPaciente = watch('tipo_paciente');
  const dataNascimento = watch('data_nascimento');

  const onSubmit = async (data: PacienteFormData) => {
    if (!clinicaAtual) {
      return;
    }

    setIsSubmitting(true);
    try {
      const pacienteData = {
        nome: data.nome,
        cpf: data.cpf,
        clinica_id: clinicaAtual,
        email: data.email || null,
        data_nascimento: data.data_nascimento ? data.data_nascimento.toISOString().split('T')[0] : null,
        telefone: data.telefone || null,
        endereco: data.endereco || null,
        observacoes: data.observacoes || null,
        tipo_paciente: data.tipo_paciente || 'novo' as const,
        ativo: true,
      };

      if (paciente) {
        await updatePaciente.mutateAsync({ 
          id: paciente.id, 
          data: pacienteData 
        });
      } else {
        await createPaciente.mutateAsync({ 
          ...pacienteData, 
          verificarLimite: true,
          inadimplente: false
        });
      }
      
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar paciente:', error);
      if (error.message === "LIMITE_ATINGIDO") {
        setShowLimiteModal(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>{paciente ? 'Editar Paciente' : 'Novo Paciente'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
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

            <div className="space-y-1">
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

            <div className="space-y-1">
              <Label>Data de Nascimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataNascimento && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataNascimento ? (
                      format(dataNascimento, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataNascimento}
                    onSelect={(date) => setValue('data_nascimento', date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                {...register('telefone')}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-1">
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

            <div className="space-y-1">
              <Label htmlFor="tipo_paciente">Tipo de Paciente</Label>
              <Select value={tipoPaciente} onValueChange={(value) => setValue('tipo_paciente', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="recorrente">Recorrente</SelectItem>
                  <SelectItem value="antigo">Antigo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              {...register('endereco')}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Observações adicionais sobre o paciente"
              rows={2}
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

      <LimiteAssinaturaModal 
        open={showLimiteModal}
        onOpenChange={setShowLimiteModal}
      />
    </Card>
  );
}
