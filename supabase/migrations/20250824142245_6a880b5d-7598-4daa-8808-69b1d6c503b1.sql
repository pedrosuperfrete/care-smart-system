-- Adicionar foreign key constraint entre usuarios_clinicas e users
ALTER TABLE public.usuarios_clinicas 
ADD CONSTRAINT fk_usuarios_clinicas_users 
FOREIGN KEY (usuario_id) REFERENCES public.users(id) 
ON DELETE CASCADE;