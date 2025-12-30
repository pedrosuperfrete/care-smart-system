/**
 * Utilitários para tratamento consistente de datas e fusos horários
 * Padroniza o comportamento entre formulários, banco de dados e exibição
 */

/**
 * Converte uma data para formato de data local (YYYY-MM-DD) sem problemas de timezone
 * Usado para salvar datas de nascimento e outros campos de data
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Converte uma string de data (YYYY-MM-DD) para Date object local
 * Usado para carregar datas do banco sem problemas de timezone
 */
export function fromLocalDateString(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Parse manual para evitar problemas de timezone
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Criar data como horário local, não UTC
  return new Date(year, month - 1, day);
}

/**
 * Converte uma data para o formato datetime-local (sem conversão de timezone)
 * Usado em inputs datetime-local para manter o horário local
 */
export function toDateTimeLocalString(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Ajustar para o timezone local sem conversão
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  
  return localDate.toISOString().slice(0, 16);
}

/**
 * Converte um valor de datetime-local para ISO string mantendo o horário local
 * Usado ao salvar dados do formulário
 * 
 * IMPORTANTE: O input datetime-local retorna formato "2025-12-30T15:00"
 * que é interpretado pelo JavaScript como horário LOCAL.
 * Porém, toISOString() converte para UTC (subtrai o offset do Brasil -3h).
 * Para preservar o horário informado, precisamos compensar o offset.
 */
export function fromDateTimeLocalString(datetimeLocal: string): string {
  if (!datetimeLocal) return '';
  
  // Criar data tratando como horário local
  const date = new Date(datetimeLocal);
  
  // Compensar o offset do timezone para que o horário salvo seja o informado
  // Exemplo: Se o usuário informou 15:00 em São Paulo (UTC-3),
  // queremos salvar como 15:00:00-03:00 (ou seja, 18:00:00Z)
  // Mas se usarmos toISOString() direto, ele retornaria 18:00:00Z,
  // que ao ser exibido no Brasil mostraria 15:00 - correto!
  // O problema é que estamos salvando a string ISO mas interpretando errado depois.
  
  // Na verdade, o comportamento correto é usar toISOString() que salva em UTC
  // e depois exibir usando toLocaleString() que converte de volta para local.
  // Vamos manter o comportamento mas garantir que a data seja criada corretamente.
  
  return date.toISOString();
}

/**
 * Formata uma data para exibição em horário local no formato brasileiro (14h30)
 * Usado para mostrar horários na interface
 */
export function formatTimeLocal(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  // Retorna no formato "14h" ou "14h30"
  if (minutes === '00') {
    return `${hours}h`;
  }
  return `${hours}h${minutes}`;
}

/**
 * Formata uma data completa para exibição em horário local no formato brasileiro
 */
export function formatDateTimeLocal(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const dateFormatted = d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    timeZone: 'America/Sao_Paulo'
  });
  
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  // Retorna no formato "30/12/2025 14h" ou "30/12/2025 14h30"
  if (minutes === '00') {
    return `${dateFormatted} ${hours}h`;
  }
  return `${dateFormatted} ${hours}h${minutes}`;
}

/**
 * Formata hora no formato brasileiro para usar com date-fns format
 * Exemplo: "14h30" ou "14h"
 */
export function formatTimeBrazilian(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  if (minutes === '00') {
    return `${hours}h`;
  }
  return `${hours}h${minutes}`;
}

/**
 * Compara se duas datas são do mesmo dia (em timezone local)
 */
export function isSameDayLocal(date1: string | Date, date2: string | Date): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  // Comparar apenas ano, mês e dia diretamente sem conversões de timezone
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * Obtém o início do dia em timezone local
 */
export function getStartOfDayLocal(date: string | Date): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Criar data no início do dia em timezone local
  const localDate = new Date(d.toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }));
  localDate.setHours(0, 0, 0, 0);
  
  return localDate;
}

/**
 * Obtém o final do dia em timezone local  
 */
export function getEndOfDayLocal(date: string | Date): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Criar data no final do dia em timezone local
  const localDate = new Date(d.toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }));
  localDate.setHours(23, 59, 59, 999);
  
  return localDate;
}