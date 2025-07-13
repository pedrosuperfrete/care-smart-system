import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useErrosSistemaPorEntidade } from "@/hooks/useErrosSistema";
import { AlertErroSistema } from "@/components/ui/alert-erro-sistema";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AgendamentoComErrosProps {
  agendamentoId: string;
  children: React.ReactNode;
}

export function AgendamentoComErros({ agendamentoId, children }: AgendamentoComErrosProps) {
  const { data: erros, isLoading } = useErrosSistemaPorEntidade(agendamentoId);

  const hasErros = erros && erros.length > 0;

  if (isLoading) {
    return <div>{children}</div>;
  }

  if (!hasErros) {
    return <div>{children}</div>;
  }

  return (
    <div className="relative">
      {children}
      
      {/* Indicador de erro */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="absolute -top-2 -right-2 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="destructive" 
                  className="h-6 w-6 p-0 rounded-full cursor-pointer hover:scale-110 transition-transform"
                >
                  <AlertTriangle className="h-3 w-3" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Este agendamento possui {erros.length} erro(s) de sincronização</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h4 className="font-medium">Erros do Agendamento</h4>
            </div>
            <div className="space-y-2">
              {erros.map((erro) => (
                <AlertErroSistema 
                  key={erro.id} 
                  erro={erro} 
                  variant="card"
                  showActions={true}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}