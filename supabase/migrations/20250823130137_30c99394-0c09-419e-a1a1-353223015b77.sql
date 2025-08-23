-- Create table for agenda blocks
CREATE TABLE public.bloqueios_agenda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID NOT NULL,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bloqueios_agenda ENABLE ROW LEVEL SECURITY;

-- Create policies for agenda blocks
CREATE POLICY "Bloqueios visíveis apenas da mesma clínica" 
ON public.bloqueios_agenda 
FOR SELECT 
USING (is_admin() OR (EXISTS ( 
  SELECT 1 
  FROM profissionais p 
  WHERE p.id = bloqueios_agenda.profissional_id 
  AND p.clinica_id IN ( 
    SELECT get_user_clinicas.clinica_id
    FROM get_user_clinicas() get_user_clinicas(clinica_id, tipo_papel)
  )
)));

CREATE POLICY "Profissionais podem criar seus próprios bloqueios" 
ON public.bloqueios_agenda 
FOR INSERT 
WITH CHECK (profissional_id = get_current_profissional_id());

CREATE POLICY "Profissionais podem atualizar seus próprios bloqueios" 
ON public.bloqueios_agenda 
FOR UPDATE 
USING (profissional_id = get_current_profissional_id());

CREATE POLICY "Profissionais podem excluir seus próprios bloqueios" 
ON public.bloqueios_agenda 
FOR DELETE 
USING (profissional_id = get_current_profissional_id());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bloqueios_agenda_updated_at
BEFORE UPDATE ON public.bloqueios_agenda
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();