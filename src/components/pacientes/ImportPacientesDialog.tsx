import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useImportPacientes } from '@/hooks/useImportPacientes';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useProfissionais } from '@/hooks/useProfissionais';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ImportPacientesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportPacientesDialog({ open, onOpenChange }: ImportPacientesDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedProfissionalId, setSelectedProfissionalId] = useState<string>('');
  const { importPacientes, isImporting, importResult, resetImportacao } = useImportPacientes();
  const { isRecepcionista, profissional } = useAuth();
  const { data: profissionais } = useProfissionais();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'csv' || fileExtension === 'xls' || fileExtension === 'xlsx') {
        setFile(selectedFile);
      } else {
        alert('Por favor, selecione um arquivo CSV ou Excel (.xls, .xlsx)');
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    // Se for recepcionista, precisa selecionar um profissional
    if (isRecepcionista && !selectedProfissionalId) {
      alert('Por favor, selecione um profissional para associar os pacientes');
      return;
    }

    // Passar o profissional_id selecionado (se for recepcionista) ou undefined
    const profissionalIdToUse = isRecepcionista ? selectedProfissionalId : profissional?.id;
    await importPacientes({ file, profissionalId: profissionalIdToUse });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    // Ao fechar, limpar estado para permitir uma nova importação ao reabrir
    if (!nextOpen) {
      setFile(null);
      setSelectedProfissionalId('');
      resetImportacao();
    }

    onOpenChange(nextOpen);
  };

  // Pode importar se: tem arquivo E (não é recepcionista OU selecionou profissional)
  const canImport = file && (!isRecepcionista || selectedProfissionalId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Pacientes</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV ou Excel (.xls, .xlsx) com os dados dos pacientes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção de Profissional (apenas para recepcionistas) */}
          {isRecepcionista && (
            <div className="space-y-2">
              <Label htmlFor="profissional-select">
                Associar pacientes ao profissional <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedProfissionalId}
                onValueChange={setSelectedProfissionalId}
                disabled={isImporting}
              >
                <SelectTrigger id="profissional-select">
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {profissionais?.map((prof) => (
                    <SelectItem key={prof.id} value={prof.id}>
                      {prof.nome} - {prof.especialidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Os pacientes importados serão associados a este profissional
              </p>
            </div>
          )}

          {/* Instruções */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato esperado:</strong> colunas recomendadas:
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">nome</code> (obrigatório),
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">cpf</code> (opcional),
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">telefone</code> (obrigatório se CPF estiver vazio),
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">email</code>,
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">data_nascimento</code> (DD/MM/AAAA),
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">cep</code>,
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">endereco</code>,
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">bairro</code>,
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">cidade</code>,
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">estado</code> (UF),
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">origem</code>,
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">modalidade_atendimento</code>,
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">observacoes</code>.
            </AlertDescription>
          </Alert>

          {/* Upload de Arquivo */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
            <input
              type="file"
              id="file-upload"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
              disabled={isImporting}
            />
            <label 
              htmlFor="file-upload" 
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              {file ? (
                <>
                  <FileSpreadsheet className="h-12 w-12 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Clique para selecionar o arquivo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      CSV, XLS ou XLSX (máx. 10MB)
                    </p>
                  </div>
                </>
              )}
            </label>
          </div>

          {/* Resultado da Importação */}
          {importResult && (
            <Alert className={importResult.imported > 0 ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              {importResult.imported > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <strong className={importResult.imported > 0 ? 'text-green-700' : 'text-red-700'}>
                  {importResult.imported > 0 ? 'Importação concluída!' : 'Falha na importação'}
                </strong>
                <p className="mt-1 text-foreground">{importResult.message}</p>
                {importResult.imported > 0 && (
                  <p className="mt-1 text-sm text-green-700 font-medium">
                    ✓ {importResult.imported} paciente(s) importado(s) com sucesso
                  </p>
                )}
                {importResult.errors.length > 0 && (
                  <div className="mt-3 text-sm">
                    <p className="font-medium text-red-700">
                      ✗ {importResult.errors.length} erro(s) encontrado(s):
                    </p>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-red-600 max-h-40 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li className="font-medium">... e mais {importResult.errors.length - 10} erro(s)</li>
                      )}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isImporting}
            >
              {importResult?.success ? 'Fechar' : 'Cancelar'}
            </Button>
            {!importResult?.success && (
              <Button
                onClick={handleImport}
                disabled={!canImport || isImporting}
              >
                {isImporting ? 'Importando...' : 'Importar Pacientes'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
