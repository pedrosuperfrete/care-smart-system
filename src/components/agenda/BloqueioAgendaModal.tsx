import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateBloqueio, CreateBloqueioData } from "@/hooks/useBloqueiosAgenda";
import { toDateTimeLocalString, fromDateTimeLocalString } from "@/lib/dateUtils";
import { CalendarX } from "lucide-react";

interface BloqueioAgendaModalProps {
  defaultDate?: Date;
  children?: React.ReactNode;
}

export const BloqueioAgendaModal = ({ defaultDate, children }: BloqueioAgendaModalProps) => {
  const [open, setOpen] = useState(false);
  const createBloqueio = useCreateBloqueio();
  const [formData, setFormData] = useState<CreateBloqueioData>({
    titulo: "",
    descricao: "",
    data_inicio: defaultDate ? toDateTimeLocalString(defaultDate) : "",
    data_fim: defaultDate ? toDateTimeLocalString(new Date(defaultDate.getTime() + 60 * 60 * 1000)) : "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.data_inicio || !formData.data_fim) {
      return;
    }

    const bloqueioData: CreateBloqueioData = {
      titulo: formData.titulo,
      descricao: formData.descricao,
      data_inicio: fromDateTimeLocalString(formData.data_inicio),
      data_fim: fromDateTimeLocalString(formData.data_fim),
    };

    try {
      await createBloqueio.mutateAsync(bloqueioData);
      setFormData({
        titulo: "",
        descricao: "",
        data_inicio: "",
        data_fim: "",
      });
      setOpen(false);
    } catch (error) {
      console.error("Erro ao criar bloqueio:", error);
    }
  };

  const handleChange = (field: keyof CreateBloqueioData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <CalendarX className="h-4 w-4 mr-2" />
            Bloquear Horário
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Bloquear Horário na Agenda</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                placeholder="Ex: Reunião, Almoço, Compromisso pessoal"
                value={formData.titulo}
                onChange={(e) => handleChange("titulo", e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="data_inicio">Início *</Label>
                <Input
                  id="data_inicio"
                  type="datetime-local"
                  value={formData.data_inicio}
                  onChange={(e) => handleChange("data_inicio", e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="data_fim">Fim *</Label>
                <Input
                  id="data_fim"
                  type="datetime-local"
                  value={formData.data_fim}
                  onChange={(e) => handleChange("data_fim", e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Detalhes opcionais sobre o bloqueio"
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createBloqueio.isPending}>
              {createBloqueio.isPending ? "Salvando..." : "Bloquear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};