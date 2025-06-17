
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tables } from '@/integrations/supabase/types';

type UserProfile = Tables<'users'>;
type Profissional = Tables<'profissionais'>;

interface PerfilBasicoProps {
  userProfile: UserProfile | null;
  profissional: Profissional | null;
  profileData: any;
  setProfileData: (data: any) => void;
}

export function PerfilBasico({ userProfile, profissional, profileData, setProfileData }: PerfilBasicoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Básicas</CardTitle>
        <CardDescription>
          Suas informações pessoais e de conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={userProfile?.email || ''} disabled />
          </div>
          
          <div className="space-y-2">
            <Label>Tipo de Usuário</Label>
            <Input value={userProfile?.tipo_usuario || ''} disabled />
          </div>

          {profissional && (
            <>
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input 
                  value={profileData.nome}
                  onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Input 
                  value={profileData.especialidade}
                  onChange={(e) => setProfileData({ ...profileData, especialidade: e.target.value })}
                  placeholder="Sua especialidade"
                />
              </div>

              <div className="space-y-2">
                <Label>CRM/CRO</Label>
                <Input 
                  value={profileData.crm_cro}
                  onChange={(e) => setProfileData({ ...profileData, crm_cro: e.target.value })}
                  placeholder="Seu registro profissional"
                />
              </div>

              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input 
                  value={profileData.telefone}
                  onChange={(e) => setProfileData({ ...profileData, telefone: e.target.value })}
                  placeholder="Seu telefone"
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
