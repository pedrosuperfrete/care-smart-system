-- Fix the ambiguous clinica_id reference in get_patients_for_role function
CREATE OR REPLACE FUNCTION public.get_patients_for_role()
 RETURNS TABLE(id uuid, nome text, cpf text, email text, telefone text, data_nascimento date, tipo_paciente tipo_paciente, clinica_id uuid, criado_em timestamp with time zone, atualizado_em timestamp with time zone, ativo boolean, inadimplente boolean, observacoes text, endereco text, cep text, cidade text, estado text, bairro text, origem text, modalidade_atendimento text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Profissionais get ALL fields including medical observations
  IF is_profissional() THEN
    RETURN QUERY
    SELECT 
      p.id, p.nome, p.cpf, p.email, p.telefone, p.data_nascimento,
      p.tipo_paciente, p.clinica_id, p.criado_em, p.atualizado_em, 
      p.ativo, p.inadimplente,
      p.observacoes, p.endereco, p.cep, p.cidade, p.estado, p.bairro,
      p.origem, p.modalidade_atendimento
    FROM pacientes p
    WHERE p.clinica_id IN (SELECT uc.clinica_id FROM get_user_clinicas() uc)
      AND p.ativo = true
    ORDER BY p.criado_em DESC;
  
  -- Recepcionistas get LIMITED fields (no medical observations or full address)
  ELSIF is_recepcionista() THEN
    RETURN QUERY
    SELECT 
      p.id, p.nome, p.cpf, p.email, p.telefone, p.data_nascimento,
      p.tipo_paciente, p.clinica_id, p.criado_em, p.atualizado_em,
      p.ativo, p.inadimplente,
      NULL::text as observacoes,              -- ❌ Hidden from receptionists
      NULL::text as endereco,                 -- ❌ Hidden
      NULL::text as cep,                       -- ❌ Hidden
      NULL::text as cidade,                    -- ❌ Hidden
      NULL::text as estado,                    -- ❌ Hidden
      NULL::text as bairro,                    -- ❌ Hidden
      NULL::text as origem,                    -- ❌ Hidden
      NULL::text as modalidade_atendimento     -- ❌ Hidden
    FROM pacientes p
    WHERE p.clinica_id IN (SELECT uc.clinica_id FROM get_user_clinicas() uc)
      AND p.ativo = true
    ORDER BY p.criado_em DESC;
  
  -- Admins get ALL fields
  ELSIF is_admin() THEN
    RETURN QUERY
    SELECT 
      p.id, p.nome, p.cpf, p.email, p.telefone, p.data_nascimento,
      p.tipo_paciente, p.clinica_id, p.criado_em, p.atualizado_em,
      p.ativo, p.inadimplente,
      p.observacoes, p.endereco, p.cep, p.cidade, p.estado, p.bairro,
      p.origem, p.modalidade_atendimento
    FROM pacientes p
    WHERE p.ativo = true
    ORDER BY p.criado_em DESC;
  
  ELSE
    -- No access for other roles
    RETURN;
  END IF;
END;
$function$;