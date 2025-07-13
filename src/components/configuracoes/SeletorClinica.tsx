import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClinica } from '@/hooks/useClinica';

export function SeletorClinica() {
  const { clinicaAtual, clinicasUsuario, setClinicaAtual } = useAuth();
  const { data: clinicasData } = useClinica();
  
  // Se o usuário só tem uma clínica, não mostrar seletor
  if (clinicasUsuario.length <= 1) {
    return null;
  }

  const clinicasDisponiveis = Array.isArray(clinicasData) ? clinicasData.filter(clinica => 
    clinicasUsuario.some(uc => uc.clinica_id === clinica.id)
  ) : [];

  const clinicaAtualData = clinicasDisponiveis.find(c => c.id === clinicaAtual);

  return (
    <div className="flex items-center space-x-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={clinicaAtual || ''} onValueChange={setClinicaAtual}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione uma clínica">
            <div className="flex items-center space-x-2">
              <span>{clinicaAtualData?.nome || 'Selecionar clínica'}</span>
              {clinicaAtualData && (
                <Badge variant="secondary" className="text-xs">
                  {clinicasUsuario.find(uc => uc.clinica_id === clinicaAtual)?.tipo_papel === 'admin_clinica' ? 'Admin' : 
                   clinicasUsuario.find(uc => uc.clinica_id === clinicaAtual)?.tipo_papel === 'profissional' ? 'Prof' : 'Recep'}
                </Badge>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {clinicasDisponiveis.map((clinica) => {
            const userRole = clinicasUsuario.find(uc => uc.clinica_id === clinica.id);
            return (
              <SelectItem key={clinica.id} value={clinica.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{clinica.nome}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {userRole?.tipo_papel === 'admin_clinica' ? 'Admin' : 
                     userRole?.tipo_papel === 'profissional' ? 'Profissional' : 'Recepcionista'}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}