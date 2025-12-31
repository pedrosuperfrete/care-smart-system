-- Deletar usuários da tabela auth.users (Supabase Auth)
DELETE FROM auth.users 
WHERE email IN (
  'marinaribeirors@gmail.com',
  'denise.rigueiral@gmail.com',
  'erickschenk@gmail.com',
  'liviarigueiral@gmail.com'
);