// Função para enviar dados de agendamento para webhook externo
export async function enviarWebhookAgendamento(
  acao: 'criar' | 'atualizar' | 'cancelar',
  agendamento: any
) {
  try {
    // Extrair dados do paciente do agendamento
    const paciente = agendamento.pacientes;
    
    if (!paciente) {
      console.warn('Webhook: Paciente não encontrado no agendamento', agendamento.id);
      return;
    }

    // Preparar payload para o webhook
    const payload = {
      acao,
      dados_agendamento: {
        nome_paciente: paciente.nome,
        email: paciente.email || '',
        cpf: paciente.cpf || '',
        inicio: agendamento.data_inicio,
        fim: agendamento.data_fim,
        motivo: agendamento.tipo_servico || agendamento.observacoes || 'Consulta',
        id_google_event: agendamento.google_event_id || '',
        id_agenda: 'clinica@group.calendar.google.com', // Valor padrão - deve ser configurável
        id_paciente: agendamento.paciente_id
      }
    };

    // Log detalhado para debug
    console.log('Enviando webhook:', {
      url: 'https://n8n-n8n-start.sclvbq.easypanel.host/webhook/sync-agendamento',
      method: 'POST',
      payload: payload
    });

    // Enviar requisição para o webhook
    const response = await fetch('https://n8n-n8n-start.sclvbq.easypanel.host/webhook/sync-agendamento', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook error response:', errorText);
      throw new Error(`Webhook falhou: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.text();
    console.log('Webhook response:', responseData);
    console.log(`Webhook enviado com sucesso para ${acao} agendamento:`, agendamento.id);
  } catch (error) {
    console.error('Erro ao enviar webhook:', error);
    // Não bloquear a operação principal se o webhook falhar
  }
}