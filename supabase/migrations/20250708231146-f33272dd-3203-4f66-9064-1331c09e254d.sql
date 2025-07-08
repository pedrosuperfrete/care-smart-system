-- Criar um paciente especial para eventos importados do Google Calendar
INSERT INTO public.pacientes (
  id,
  nome,
  cpf,
  clinica_id,
  email,
  observacoes,
  ativo
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Evento Externo',
  '000.000.000-00',
  (SELECT id FROM clinicas LIMIT 1),
  'evento.externo@sistema.com',
  'Paciente especial para eventos importados do Google Calendar ou bloqueios de agenda',
  true
) ON CONFLICT (id) DO NOTHING;