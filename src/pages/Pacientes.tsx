
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search } from 'lucide-react';
import { usePacientes } from '@/hooks/usePacientes';
import { Link } from 'react-router-dom';
import { PacienteFormWithLimit } from '@/components/forms/PacienteFormWithLimit';
import { useLimitePacientes } from '@/hooks/usePlanos';

export default function Pacientes() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState(null);
  const { data, refetch } = usePacientes(search);
  const { podeAdicionarPaciente } = useLimitePacientes();

  useEffect(() => {
    refetch();
  }, [search, refetch]);

  const handleNovoClick = () => {
    if (!podeAdicionarPaciente) {
      // O componente PacienteFormWithLimit vai mostrar o modal de limite
      setShowForm(true);
    } else {
      setShowForm(true);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pacientes</h1>
        <p className="text-gray-600 mt-1">
          Gerencie seus pacientes e informações de contato
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative flex items-center space-x-2">
          <Input
            type="search"
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80"
          />
          <Search className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
        </div>
        <Button onClick={handleNovoClick}>
          Novo Paciente
        </Button>
      </div>

      <PacienteFormWithLimit
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingPaciente(null);
        }}
        onSuccess={() => {
          setShowForm(false);
          setEditingPaciente(null);
          refetch();
        }}
        editingPaciente={editingPaciente}
      />

      <Table>
        <TableCaption>Lista de todos os seus pacientes.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((paciente) => (
            <TableRow key={paciente.id}>
              <TableCell>{paciente.nome}</TableCell>
              <TableCell>{paciente.cpf}</TableCell>
              <TableCell>{paciente.telefone || 'N/A'}</TableCell>
              <TableCell>{paciente.email || 'N/A'}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingPaciente(paciente);
                    setShowForm(true);
                  }}
                >
                  Editar
                </Button>
                <Link to={`/pacientes/${paciente.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    Ver
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
