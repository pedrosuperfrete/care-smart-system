import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useImportPacientes } from '@/hooks/useImportPacientes';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportPacientesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportPacientesDialog({ open, onOpenChange }: ImportPacientesDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const { importPacientes, isImporting, importResult } = useImportPacientes();

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
    
    await importPacientes(file);
  };

  const handleClose = () => {
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Pacientes</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV ou Excel (.xls, .xlsx) com os dados dos pacientes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instruções */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato esperado:</strong> O arquivo deve conter as colunas: 
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">nome</code>,
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">cpf</code>,
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">email</code>,
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">telefone</code>,
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">data_nascimento</code> (formato DD/MM/AAAA),
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">endereco</code>,
              <code className="mx-1 px-2 py-1 bg-muted rounded text-sm">observacoes</code>
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
            <Alert className={importResult.success ? 'border-green-500' : 'border-red-500'}>
              {importResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>
                <strong>{importResult.success ? 'Sucesso!' : 'Erro'}</strong>
                <p className="mt-1">{importResult.message}</p>
                {importResult.imported > 0 && (
                  <p className="mt-1 text-sm">
                    {importResult.imported} paciente(s) importado(s) com sucesso
                  </p>
                )}
                {importResult.errors.length > 0 && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium">Erros encontrados:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {importResult.errors.slice(0, 5).map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>... e mais {importResult.errors.length - 5} erro(s)</li>
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
              onClick={handleClose}
              disabled={isImporting}
            >
              {importResult?.success ? 'Fechar' : 'Cancelar'}
            </Button>
            {!importResult?.success && (
              <Button
                onClick={handleImport}
                disabled={!file || isImporting}
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
