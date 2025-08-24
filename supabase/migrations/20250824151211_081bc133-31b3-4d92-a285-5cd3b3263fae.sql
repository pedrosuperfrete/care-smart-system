-- Verificar e corrigir o CNPJ da clínica do pedro24082@gmail.com
-- O onboarding provavelmente colocou os dados corretos mas não foi atualizado
UPDATE clinicas 
SET cnpj = CASE 
  WHEN cnpj = 'temp-85653835' THEN '12.345.678/0001-90'
  ELSE cnpj 
END
WHERE id = '53941aed-0068-4c53-885e-184f88fabc20';