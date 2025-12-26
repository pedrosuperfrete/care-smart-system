import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useClinica } from './useClinica';

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
}

interface PacienteImport {
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
  cep?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  observacoes?: string;
  origem?: string;
  modalidade_atendimento?: string;
}

// Mapeamento flexível de colunas CSV -> campos do banco
const COLUMN_MAPPINGS: Record<string, string[]> = {
  nome: ['nome', 'name', 'nome completo', 'nome_completo', 'nomecompleto', 'paciente', 'patient', 'full_name', 'fullname'],
  cpf: ['cpf', 'cpf_cnpj', 'documento', 'document', 'cpfcnpj'],
  email: ['email', 'e-mail', 'e_mail', 'mail', 'correio', 'email_paciente'],
  telefone: ['telefone', 'phone', 'tel', 'celular', 'cell', 'mobile', 'fone', 'whatsapp', 'contato', 'telefone_paciente'],
  data_nascimento: ['data_nascimento', 'data nascimento', 'datanascimento', 'nascimento', 'birth', 'birthday', 'birth_date', 'birthdate', 'dt_nascimento', 'dt nascimento', 'data_nasc', 'data nasc'],
  cep: ['cep', 'zip', 'zipcode', 'zip_code', 'codigo_postal', 'postal'],
  endereco: ['endereco', 'endereço', 'address', 'rua', 'street', 'logradouro', 'endereco_completo'],
  bairro: ['bairro', 'neighborhood', 'district', 'setor'],
  cidade: ['cidade', 'city', 'municipio', 'município'],
  estado: ['estado', 'state', 'uf', 'sigla_estado'],
  observacoes: ['observacoes', 'observações', 'obs', 'notes', 'notas', 'comentarios', 'comentários', 'comments', 'anotacoes', 'anotações'],
  origem: ['origem', 'origin', 'source', 'indicacao', 'indicação', 'como_conheceu', 'como conheceu'],
  modalidade_atendimento: ['modalidade_atendimento', 'modalidade atendimento', 'modalidade', 'tipo_atendimento', 'tipo atendimento', 'convenio', 'convênio', 'plano'],
};

// Função para mapear header do CSV para campo do banco
const mapHeaderToField = (header: string): string | null => {
  const normalizedHeader = header.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[_\-\s]+/g, ' '); // Normaliza separadores

  for (const [field, variations] of Object.entries(COLUMN_MAPPINGS)) {
    const normalizedVariations = variations.map(v => 
      v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_\-\s]+/g, ' ')
    );
    if (normalizedVariations.includes(normalizedHeader)) {
      return field;
    }
  }
  return null;
};

// Normaliza uma linha de dados mapeando headers para campos conhecidos
const normalizeRow = (row: Record<string, any>): PacienteImport => {
  const normalized: Record<string, any> = {};
  
  for (const [originalKey, value] of Object.entries(row)) {
    const mappedField = mapHeaderToField(originalKey);
    if (mappedField && value !== undefined && value !== null && value !== '') {
      normalized[mappedField] = String(value);
    }
  }
  
  return normalized as PacienteImport;
};

export function useImportPacientes() {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: clinica } = useClinica();

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    
    // Tenta formatos: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, D/M/YYYY
    const patterns = [
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,  // DD/MM/YYYY ou D/M/YYYY
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/   // YYYY-MM-DD
    ];

    for (const pattern of patterns) {
      const match = dateStr.trim().match(pattern);
      if (match) {
        if (match[1].length === 4) {
          // YYYY-MM-DD
          const month = match[2].padStart(2, '0');
          const day = match[3].padStart(2, '0');
          return `${match[1]}-${month}-${day}`;
        } else {
          // DD/MM/YYYY -> YYYY-MM-DD
          const day = match[1].padStart(2, '0');
          const month = match[2].padStart(2, '0');
          return `${match[3]}-${month}-${day}`;
        }
      }
    }
    
    return null;
  };

  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.length === 11;
  };

  const parseFile = async (file: File): Promise<PacienteImport[]> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Normalizar cada linha mapeando headers para campos conhecidos
            const normalizedData = (results.data as Record<string, any>[]).map(normalizeRow);
            resolve(normalizedData);
          },
          error: (error) => {
            reject(error);
          },
        });
      });
    } else if (fileExtension === 'xls' || fileExtension === 'xlsx') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
              raw: false,
              defval: '',
            });
            
            // Normalizar cada linha mapeando headers para campos conhecidos
            const normalizedData = (jsonData as Record<string, any>[]).map(normalizeRow);
            resolve(normalizedData);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsBinaryString(file);
      });
    }

    throw new Error('Formato de arquivo não suportado');
  };

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      if (!clinica?.id) {
        throw new Error('Clínica não identificada');
      }

      const pacientes = await parseFile(file);
      const errors: string[] = [];
      let imported = 0;

      for (let i = 0; i < pacientes.length; i++) {
        const paciente = pacientes[i];
        const linha = i + 2; // +2 porque linha 1 é o cabeçalho e arrays começam em 0

        // Validação básica
        if (!paciente.nome || !paciente.cpf || paciente.nome.trim() === '' || paciente.cpf.trim() === '') {
          errors.push(`Linha ${linha}: Nome e CPF são obrigatórios`);
          continue;
        }

        if (!validateCPF(paciente.cpf)) {
          errors.push(`Linha ${linha}: CPF inválido (${paciente.cpf})`);
          continue;
        }

        // Preparar dados do paciente
        const pacienteData: any = {
          nome: paciente.nome.trim(),
          cpf: paciente.cpf.replace(/\D/g, ''),
          clinica_id: clinica.id,
          email: paciente.email?.trim() || null,
          telefone: paciente.telefone?.trim() || null,
          cep: paciente.cep?.trim() || null,
          endereco: paciente.endereco?.trim() || null,
          bairro: paciente.bairro?.trim() || null,
          cidade: paciente.cidade?.trim() || null,
          estado: paciente.estado?.trim().toUpperCase() || null,
          observacoes: paciente.observacoes?.trim() || null,
          origem: paciente.origem?.trim() || null,
          modalidade_atendimento: paciente.modalidade_atendimento?.trim() || null,
        };

        // Processar data de nascimento
        if (paciente.data_nascimento) {
          const dataNascimento = parseDate(paciente.data_nascimento);
          if (dataNascimento) {
            pacienteData.data_nascimento = dataNascimento;
          } else {
            errors.push(`Linha ${linha}: Data de nascimento inválida (${paciente.data_nascimento})`);
          }
        }

        try {
          // Usar upsert para atualizar pacientes existentes pelo CPF
          const { error } = await supabase
            .from('pacientes')
            .upsert(pacienteData, { 
              onConflict: 'cpf,clinica_id',
              ignoreDuplicates: false 
            });

          if (error) {
            errors.push(`Linha ${linha}: ${error.message}`);
          } else {
            imported++;
          }
        } catch (error: any) {
          errors.push(`Linha ${linha}: Erro ao importar - ${error.message}`);
        }
      }

      return { imported, total: pacientes.length, errors };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['pacientes-stats'] });

      const result: ImportResult = {
        success: data.imported > 0,
        message: data.imported === data.total
          ? `Todos os ${data.imported} paciente(s) foram importados com sucesso!`
          : data.imported > 0
          ? `${data.imported} de ${data.total} paciente(s) foram importados.`
          : 'Nenhum paciente foi importado.',
        imported: data.imported,
        errors: data.errors,
      };

      setImportResult(result);

      if (data.imported > 0) {
        toast({
          title: 'Importação concluída',
          description: result.message,
        });
      }
    },
    onError: (error: any) => {
      const result: ImportResult = {
        success: false,
        message: 'Erro ao processar arquivo: ' + error.message,
        imported: 0,
        errors: [error.message],
      };

      setImportResult(result);

      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    importPacientes: mutation.mutate,
    isImporting: mutation.isPending,
    importResult,
  };
}
