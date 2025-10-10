
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
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { useCreatePaciente, useUpdatePaciente } from '@/hooks/usePacientes';
import { LimiteAssinaturaModal } from '@/components/modals/LimiteAssinaturaModal';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';
import { toLocalDateString, fromLocalDateString } from '@/lib/dateUtils';

type Paciente = Tables<'pacientes'>;

// ⚠️ SECURITY: CPF validation with algorithm check
const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  
  // Check for known invalid patterns (all digits the same)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validate check digits using CPF algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

const pacienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255, 'Nome muito longo'),
  cpf: z.string()
    .min(11, 'CPF deve ter 11 dígitos')
    .refine(validateCPF, 'CPF inválido'),
  data_nascimento: z.date().optional(),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo')
    .refine((val) => {
      if (!val) return true;
      // Prevent email injection attacks
      return !/[<>\"'\[\]\\]/.test(val);
    }, 'Email contém caracteres inválidos')
    .optional()
    .or(z.literal('')),
  telefone: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const clean = val.replace(/\D/g, '');
      return clean.length === 10 || clean.length === 11;
    }, 'Telefone deve ter 10 ou 11 dígitos'),
  cep: z.string().optional(),
  endereco: z.string().max(500, 'Endereço muito longo').optional(),
  bairro: z.string().max(100, 'Bairro muito longo').optional(),
  cidade: z.string().max(100, 'Cidade muito longa').optional(),
  estado: z.string().max(2, 'Estado deve ter 2 caracteres').optional(),
  observacoes: z.string().max(2000, 'Observações muito longas').optional(),
  tipo_paciente: z.enum(['novo', 'recorrente', 'antigo']).optional(),
  origem: z.string().optional(),
  modalidade_atendimento: z.string().optional(),
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
  
  // Formata telefone inicial se houver
  const formatarTelefoneInicial = (telefone: string | null) => {
    if (!telefone) return '';
    const numbers = telefone.replace(/\D/g, '').slice(0, 11);
    let formatted = '';
    if (numbers.length > 0) {
      formatted = '(' + numbers.substring(0, 2);
      if (numbers.length >= 3) {
        formatted += ') ' + numbers.substring(2, 7);
      }
      if (numbers.length >= 8) {
        formatted += '-' + numbers.substring(7, 11);
      }
    }
    return formatted;
  };
  
  const [telefoneFormatado, setTelefoneFormatado] = useState(
    formatarTelefoneInicial(paciente?.telefone || '')
  );
  
  const [cepFormatado, setCepFormatado] = useState(
    paciente?.cep || ''
  );

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
      data_nascimento: paciente.data_nascimento ? fromLocalDateString(paciente.data_nascimento) : undefined,
      email: paciente.email || '',
      telefone: paciente.telefone || '',
      cep: (paciente as any).cep || '',
      endereco: paciente.endereco || '',
      bairro: (paciente as any).bairro || '',
      cidade: (paciente as any).cidade || '',
      estado: (paciente as any).estado || '',
      observacoes: paciente.observacoes || '',
      tipo_paciente: paciente.tipo_paciente || 'novo',
      origem: (paciente as any).origem || '',
      modalidade_atendimento: (paciente as any).modalidade_atendimento || '',
    } : {
      tipo_paciente: 'novo',
    },
  });

  const tipoPaciente = watch('tipo_paciente');
  const origem = watch('origem');
  const modalidadeAtendimento = watch('modalidade_atendimento');
  const dataNascimento = watch('data_nascimento');

  // Função para formatar CPF (apenas números)
  const formatCPF = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);
    // Aplica formatação XXX.XXX.XXX-XX
    return limited.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                 .replace(/(\d{3})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4')
                 .replace(/(\d{3})(\d{3})(\d{2})/, '$1.$2.$3')
                 .replace(/(\d{3})(\d{2})/, '$1.$2');
  };

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
        data_nascimento: data.data_nascimento ? toLocalDateString(data.data_nascimento) : null,
        telefone: data.telefone || null,
        cep: data.cep || null,
        endereco: data.endereco || null,
        bairro: data.bairro || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        observacoes: data.observacoes || null,
        tipo_paciente: data.tipo_paciente || 'novo' as const,
        origem: data.origem || null,
        modalidade_atendimento: data.modalidade_atendimento || null,
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
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Linha 1: Nome, CPF, Data de Nascimento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value);
                  setValue('cpf', formatted.replace(/\D/g, ''));
                  e.target.value = formatted;
                }}
                onKeyPress={(e) => {
                  if (!/[\d]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
              {errors.cpf && (
                <p className="text-sm text-red-600">{errors.cpf.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Data de Nascimento</Label>
              <EnhancedDatePicker
                date={dataNascimento}
                onDateChange={(date) => setValue('data_nascimento', date)}
                placeholder="Selecione a data"
                disabled={(date) => date > new Date()}
              />
            </div>
          </div>

          {/* Linha 2: Telefone, Email, Origem */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                placeholder="(11) 99999-9999"
                maxLength={15}
                value={telefoneFormatado}
                onChange={(e) => {
                  const input = e.target.value;
                  const numbers = input.replace(/\D/g, '').slice(0, 11);
                  
                  let formatted = '';
                  if (numbers.length > 0) {
                    formatted = '(' + numbers.substring(0, 2);
                    if (numbers.length >= 3) {
                      formatted += ') ' + numbers.substring(2, 7);
                    }
                    if (numbers.length >= 8) {
                      formatted += '-' + numbers.substring(7, 11);
                    }
                  }
                  
                  setTelefoneFormatado(formatted);
                  setValue('telefone', numbers);
                }}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="email@exemplo.com"
                onInvalid={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.validity.typeMismatch) {
                    target.setCustomValidity('Por favor, inclua um "@" no endereço de email.');
                  } else if (target.validity.valueMissing) {
                    target.setCustomValidity('Por favor, preencha este campo.');
                  } else {
                    target.setCustomValidity('');
                  }
                }}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.setCustomValidity('');
                }}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="origem">Origem</Label>
              <Select value={origem} onValueChange={(value) => setValue('origem', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indicacao_amigo">Indicação amigo</SelectItem>
                  <SelectItem value="indicacao_paciente">Indicação paciente</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha 3: Tipo de Paciente, Modalidade do Atendimento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            <div className="space-y-1">
              <Label htmlFor="modalidade_atendimento">Modalidade do atendimento</Label>
              <Select value={modalidadeAtendimento} onValueChange={(value) => setValue('modalidade_atendimento', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a modalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plano">Atendimento pelo plano</SelectItem>
                  <SelectItem value="particular_reembolso">Particular com reembolso</SelectItem>
                  <SelectItem value="particular">Particular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha 4: CEP, Rua/Número/Complemento */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                maxLength={9}
                value={cepFormatado}
                onChange={(e) => {
                  const input = e.target.value;
                  const numbers = input.replace(/\D/g, '').slice(0, 8);
                  
                  let formatted = '';
                  if (numbers.length > 0) {
                    formatted = numbers.substring(0, 5);
                    if (numbers.length >= 6) {
                      formatted += '-' + numbers.substring(5, 8);
                    }
                  }
                  
                  setCepFormatado(formatted);
                  setValue('cep', numbers);
                }}
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <Label htmlFor="endereco">Rua, número e complemento</Label>
              <Input
                id="endereco"
                {...register('endereco')}
                placeholder="Rua, número, complemento"
              />
            </div>
          </div>

          {/* Linha 5: Bairro, Cidade, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                {...register('bairro')}
                placeholder="Bairro"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                {...register('cidade')}
                placeholder="Cidade"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                {...register('estado')}
                placeholder="UF"
                maxLength={2}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setValue('estado', value);
                  e.target.value = value;
                }}
              />
            </div>
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
