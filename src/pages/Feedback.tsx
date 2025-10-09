import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const feedbackSchema = z.object({
  tipo: z.enum(['bug', 'ideia', 'duvida'], {
    required_error: "Por favor, selecione o tipo de feedback",
  }),
  mensagem: z.string()
    .trim()
    .min(10, { message: "A mensagem deve ter pelo menos 10 caracteres" })
    .max(2000, { message: "A mensagem deve ter no máximo 2000 caracteres" }),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

export default function Feedback() {
  const { userProfile, profissional } = useAuth();
  const [tipo, setTipo] = useState<string>('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errors, setErrors] = useState<{ tipo?: string; mensagem?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validação
    try {
      const validatedData = feedbackSchema.parse({
        tipo,
        mensagem,
      });

      setLoading(true);

      // Informações do usuário
      const userName = profissional?.nome || userProfile?.email?.split('@')[0] || 'Usuário';
      const userEmail = userProfile?.email || 'Email não disponível';
      const userType = userProfile?.tipo_usuario || 'N/A';

      // Enviar email via edge function
      const { error } = await supabase.functions.invoke('enviar-feedback', {
        body: {
          tipo: validatedData.tipo,
          mensagem: validatedData.mensagem,
          userName,
          userEmail,
          userType,
        },
      });

      if (error) {
        console.error('Erro ao enviar feedback:', error);
        toast({
          title: "Erro ao enviar feedback",
          description: "Ocorreu um erro ao enviar seu feedback. Por favor, tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setEnviado(true);
      setTipo('');
      setMensagem('');

      // Resetar após 5 segundos
      setTimeout(() => {
        setEnviado(false);
      }, 5000);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { tipo?: string; mensagem?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels = {
      bug: 'Reportar Bug',
      ideia: 'Sugerir Ideia',
      duvida: 'Tirar Dúvida'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Feedback
        </h1>
        <p className="text-muted-foreground mt-1">
          Nos ajude a melhorar! Relate bugs, sugira ideias ou tire suas dúvidas.
        </p>
      </div>

      {enviado ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-900 mb-2">
                  Feedback enviado com sucesso!
                </h3>
                <p className="text-green-700">
                  Obrigado pelo seu feedback! Recebemos sua mensagem e entraremos em contato em breve.
                </p>
              </div>
              <Button
                onClick={() => setEnviado(false)}
                variant="outline"
                className="mt-4"
              >
                Enviar outro feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Enviar Feedback</CardTitle>
            <CardDescription>
              Preencha o formulário abaixo para nos enviar seu feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Feedback *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger id="tipo" className={errors.tipo ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecione o tipo de feedback" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">
                      <div className="flex items-center gap-2">
                        🐛 Reportar Bug
                      </div>
                    </SelectItem>
                    <SelectItem value="ideia">
                      <div className="flex items-center gap-2">
                        💡 Sugerir Ideia
                      </div>
                    </SelectItem>
                    <SelectItem value="duvida">
                      <div className="flex items-center gap-2">
                        ❓ Tirar Dúvida
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipo && (
                  <p className="text-sm text-destructive">{errors.tipo}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensagem">Mensagem *</Label>
                <Textarea
                  id="mensagem"
                  placeholder="Descreva seu feedback em detalhes..."
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  className={`min-h-[200px] resize-none ${errors.mensagem ? 'border-destructive' : ''}`}
                  maxLength={2000}
                />
                <div className="flex justify-between items-center">
                  <div>
                    {errors.mensagem && (
                      <p className="text-sm text-destructive">{errors.mensagem}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {mensagem.length}/2000 caracteres
                  </p>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  Seu feedback será enviado para nossa equipe e entraremos em contato através do email cadastrado na sua conta.
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Feedback
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
