-- Permitir que profissionais autenticados criem e gerenciem seus próprios templates
DROP POLICY IF EXISTS "Apenas admin pode gerenciar modelos" ON public.modelos_prontuarios;

-- Permitir visualização de templates por todos usuários autenticados
CREATE POLICY "Modelos visíveis por todos usuários autenticados" 
ON public.modelos_prontuarios 
FOR SELECT 
USING (true);

-- Permitir que profissionais criem templates
CREATE POLICY "Profissionais podem criar templates" 
ON public.modelos_prontuarios 
FOR INSERT 
WITH CHECK (get_current_profissional_id() IS NOT NULL);

-- Permitir que profissionais atualizem templates
CREATE POLICY "Profissionais podem atualizar templates" 
ON public.modelos_prontuarios 
FOR UPDATE 
USING (get_current_profissional_id() IS NOT NULL);

-- Permitir que profissionais excluam templates
CREATE POLICY "Profissionais podem excluir templates" 
ON public.modelos_prontuarios 
FOR DELETE 
USING (get_current_profissional_id() IS NOT NULL);