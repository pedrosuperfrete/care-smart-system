
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { UserPlus } from 'lucide-react';

// Mock data para usuários (para admin)
const usuarios = [
  {
    id: '1',
    email: 'dr.joao@clinica.com',
    tipo: 'profissional',
    ativo: true,
    nome: 'Dr. João Silva',
    especialidade: 'Cardiologia'
  },
  {
    id: '2',
    email: 'maria@clinica.com',
    tipo: 'recepcionista',
    ativo: true,
    nome: 'Maria Santos',
    especialidade: null
  }
];

interface GerenciarEquipeProps {
  isAdmin: boolean;
}

export function GerenciarEquipe({ isAdmin }: GerenciarEquipeProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciar Equipe</CardTitle>
          <CardDescription>
            {isAdmin ? 'Gerencie os usuários e suas permissões' : 'Visualize a equipe da clínica'}
          </CardDescription>
        </div>
        
        {isAdmin && (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Adicionar Usuário
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {usuarios.map((usuario) => (
            <div key={usuario.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div>
                    <h4 className="font-medium">{usuario.nome || usuario.email}</h4>
                    <p className="text-sm text-gray-600">{usuario.email}</p>
                    {usuario.especialidade && (
                      <p className="text-sm text-gray-500">{usuario.especialidade}</p>
                    )}
                  </div>
                  <Badge variant={usuario.tipo === 'admin' ? 'default' : 'secondary'}>
                    {usuario.tipo}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch checked={usuario.ativo} disabled={!isAdmin} />
                {isAdmin && (
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
