import { useState } from "react";
import { Bell, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useErrosSistema } from "@/hooks/useErrosSistema";
import { AlertErroSistema } from "@/components/ui/alert-erro-sistema";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

export function NotificacaoErros() {
  const { data: erros } = useErrosSistema();
  const [isOpen, setIsOpen] = useState(false);

  const totalErros = erros?.length || 0;
  const errosRecentes = erros?.slice(0, 3) || [];

  if (totalErros === 0) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {totalErros > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {totalErros > 9 ? '9+' : totalErros}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Erros do Sistema
          </div>
          <Badge variant="secondary">{totalErros}</Badge>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <div className="max-h-96 overflow-y-auto">
          {errosRecentes.map((erro) => (
            <DropdownMenuItem key={erro.id} className="p-0">
              <div className="w-full p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={erro.tipo === 'calendar_sync' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {erro.tipo === 'calendar_sync' ? 'Calendar' : erro.tipo}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(erro.data_ocorrencia), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                      {erro.mensagem_erro}
                    </p>
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link 
            to="/erros-sistema" 
            className="w-full text-center"
            onClick={() => setIsOpen(false)}
          >
            Ver todos os erros
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}