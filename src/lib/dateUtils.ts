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
 */
export function fromDateTimeLocalString(datetimeLocal: string): string {
  if (!datetimeLocal) return '';
  
  // Criar data tratando como horário local (sem conversão de timezone)
  const date = new Date(datetimeLocal);
  
  return date.toISOString();
}

/**
 * Formata uma data para exibição em horário local
 * Usado para mostrar horários na interface
 */
export function formatTimeLocal(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
}

/**
 * Formata uma data completa para exibição em horário local
 */
export function formatDateTimeLocal(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
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