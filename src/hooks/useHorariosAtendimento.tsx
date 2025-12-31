import { useMemo } from 'react';
import { useAuth } from './useAuth';

interface HorarioDia {
  ativo: boolean;
  inicio: string;
  fim: string;
}

interface HorariosAtendimento {
  domingo?: HorarioDia;
  segunda?: HorarioDia;
  terca?: HorarioDia;
  quarta?: HorarioDia;
  quinta?: HorarioDia;
  sexta?: HorarioDia;
  sabado?: HorarioDia;
}

interface BloqueioVirtual {
  id: string;
  data_inicio: string;
  data_fim: string;
  titulo: string;
  descricao: string;
  virtual: true;
  profissional_id?: string;
}

interface ProfissionalComHorarios {
  id: string;
  nome: string;
  horarios_atendimento?: unknown;
}

// Mapeia dia da semana JS (0-6) para chave do objeto de horários
const dayKeyMap: Record<number, keyof HorariosAtendimento> = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado',
};

/**
 * Gera bloqueios virtuais para os horários fora do expediente de um profissional
 */
function gerarBloqueiosVirtuaisProfissional(
  date: Date,
  profissionalId: string,
  horarios: HorariosAtendimento
): BloqueioVirtual[] {
  const bloqueios: BloqueioVirtual[] = [];
  const dayOfWeek = date.getDay();
  const dayKey = dayKeyMap[dayOfWeek];
  const horarioDia = horarios[dayKey];
  
  const dateStr = date.toISOString().split('T')[0];

  // Se o dia não está ativo, bloqueia o dia inteiro
  if (!horarioDia?.ativo) {
    bloqueios.push({
      id: `virtual-${profissionalId}-${dateStr}-closed`,
      data_inicio: `${dateStr}T00:00:00`,
      data_fim: `${dateStr}T23:59:00`,
      titulo: 'Dia fechado',
      descricao: 'Não há atendimento neste dia',
      virtual: true,
      profissional_id: profissionalId,
    });
    return bloqueios;
  }

  // Bloquear horários antes do início do expediente (da 0h até o início)
  const [inicioHours, inicioMinutes] = horarioDia.inicio.split(':').map(Number);
  if (inicioHours > 0 || inicioMinutes > 0) {
    bloqueios.push({
      id: `virtual-${profissionalId}-${dateStr}-before`,
      data_inicio: `${dateStr}T00:00:00`,
      data_fim: `${dateStr}T${horarioDia.inicio}:00`,
      titulo: 'Fora do expediente',
      descricao: 'Horário antes do início do atendimento',
      virtual: true,
      profissional_id: profissionalId,
    });
  }

  // Bloquear horários após o fim do expediente (do fim até 23:59)
  const [fimHours] = horarioDia.fim.split(':').map(Number);
  if (fimHours < 24) {
    bloqueios.push({
      id: `virtual-${profissionalId}-${dateStr}-after`,
      data_inicio: `${dateStr}T${horarioDia.fim}:00`,
      data_fim: `${dateStr}T23:59:00`,
      titulo: 'Fora do expediente',
      descricao: 'Horário após o fim do atendimento',
      virtual: true,
      profissional_id: profissionalId,
    });
  }

  return bloqueios;
}

/**
 * Hook que retorna os horários de atendimento do profissional atual
 * e funções auxiliares para verificar disponibilidade
 */
export function useHorariosAtendimento() {
  const { profissional } = useAuth();

  const horarios = useMemo(() => {
    return (profissional?.horarios_atendimento as HorariosAtendimento) || {};
  }, [profissional?.horarios_atendimento]);

  /**
   * Verifica se um dia específico está ativo (profissional atende nesse dia)
   */
  const isDiaAtivo = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    const dayKey = dayKeyMap[dayOfWeek];
    const horarioDia = horarios[dayKey];
    return horarioDia?.ativo ?? false;
  };

  /**
   * Retorna o horário de atendimento de um dia específico
   */
  const getHorarioDia = (date: Date): HorarioDia | null => {
    const dayOfWeek = date.getDay();
    const dayKey = dayKeyMap[dayOfWeek];
    const horarioDia = horarios[dayKey];
    return horarioDia?.ativo ? horarioDia : null;
  };

  /**
   * Verifica se um horário específico está dentro do expediente
   */
  const isHorarioDisponivel = (date: Date, time: string): boolean => {
    const horarioDia = getHorarioDia(date);
    if (!horarioDia) return false; // Dia não ativo

    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;

    const [inicioHours, inicioMinutes] = horarioDia.inicio.split(':').map(Number);
    const inicioInMinutes = inicioHours * 60 + inicioMinutes;

    const [fimHours, fimMinutes] = horarioDia.fim.split(':').map(Number);
    const fimInMinutes = fimHours * 60 + fimMinutes;

    return timeInMinutes >= inicioInMinutes && timeInMinutes < fimInMinutes;
  };

  /**
   * Gera bloqueios virtuais para os horários fora do expediente de um dia específico
   * Esses bloqueios são mostrados na agenda mas não são salvos no banco
   */
  const getBloqueiosVirtuais = (date: Date): BloqueioVirtual[] => {
    if (!profissional) return [];
    return gerarBloqueiosVirtuaisProfissional(date, profissional.id, horarios);
  };

  /**
   * Gera bloqueios virtuais para uma semana inteira
   */
  const getBloqueiosVirtuaisSemana = (startOfWeek: Date): BloqueioVirtual[] => {
    const bloqueios: BloqueioVirtual[] = [];
    
    for (let i = 0; i < 7; i++) {
      const dia = new Date(startOfWeek);
      dia.setDate(startOfWeek.getDate() + i);
      bloqueios.push(...getBloqueiosVirtuais(dia));
    }
    
    return bloqueios;
  };

  /**
   * Verifica se há horários de atendimento configurados
   */
  const hasHorariosConfigurados = useMemo(() => {
    return Object.values(horarios).some(h => h?.ativo);
  }, [horarios]);

  return {
    horarios,
    isDiaAtivo,
    getHorarioDia,
    isHorarioDisponivel,
    getBloqueiosVirtuais,
    getBloqueiosVirtuaisSemana,
    hasHorariosConfigurados,
  };
}

/**
 * Hook para gerar bloqueios virtuais de múltiplos profissionais
 * Usado por admin/secretária para visualizar a agenda de todos
 */
export function useHorariosMultiplosProfissionais(profissionais: ProfissionalComHorarios[]) {
  /**
   * Gera bloqueios virtuais para um dia específico de todos os profissionais
   */
  const getBloqueiosVirtuaisMultiplos = (date: Date): BloqueioVirtual[] => {
    const todosBloqueios: BloqueioVirtual[] = [];
    
    for (const prof of profissionais) {
      const horarios = (prof.horarios_atendimento as HorariosAtendimento) || {};
      const bloqueiosProf = gerarBloqueiosVirtuaisProfissional(date, prof.id, horarios);
      todosBloqueios.push(...bloqueiosProf);
    }
    
    return todosBloqueios;
  };

  /**
   * Gera bloqueios virtuais para uma semana inteira de todos os profissionais
   */
  const getBloqueiosVirtuaisSemanaMultiplos = (startOfWeek: Date): BloqueioVirtual[] => {
    const bloqueios: BloqueioVirtual[] = [];
    
    for (let i = 0; i < 7; i++) {
      const dia = new Date(startOfWeek);
      dia.setDate(startOfWeek.getDate() + i);
      bloqueios.push(...getBloqueiosVirtuaisMultiplos(dia));
    }
    
    return bloqueios;
  };

  return {
    getBloqueiosVirtuaisMultiplos,
    getBloqueiosVirtuaisSemanaMultiplos,
  };
}
