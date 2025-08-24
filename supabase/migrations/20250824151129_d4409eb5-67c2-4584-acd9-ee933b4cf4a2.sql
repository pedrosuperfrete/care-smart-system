-- Atualizar a clínica temporária com os dados corretos do onboarding
UPDATE clinicas 
SET 
  nome = 'Clinica 2',
  endereco = 'Endereço da Clinica 2',
  cnpj = '12345678000100' -- CNPJ exemplo, pode ser ajustado
WHERE id = '53941aed-0068-4c53-885e-184f88fabc20' 
AND nome = 'Clínica Temporária';