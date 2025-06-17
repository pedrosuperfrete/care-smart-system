
-- Adicionar campos necessários na tabela profissionais para o onboarding
ALTER TABLE public.profissionais 
ADD COLUMN mini_bio TEXT,
ADD COLUMN servicos_oferecidos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN nome_clinica TEXT,
ADD COLUMN horarios_atendimento JSONB DEFAULT '{}'::jsonb,
ADD COLUMN servicos_precos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN formas_pagamento JSONB DEFAULT '[]'::jsonb,
ADD COLUMN planos_saude JSONB DEFAULT '[]'::jsonb,
ADD COLUMN onboarding_completo BOOLEAN DEFAULT false;
