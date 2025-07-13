-- Inserir o usuário órfão na tabela users
INSERT INTO public.users (id, email, tipo_usuario, senha_hash, ativo) 
VALUES ('f0f5cb78-3477-45e8-b58b-c4847c0ec33e', 'cidinha@cida.com', 'recepcionista', 'managed_by_auth', true)
ON CONFLICT (id) DO NOTHING;