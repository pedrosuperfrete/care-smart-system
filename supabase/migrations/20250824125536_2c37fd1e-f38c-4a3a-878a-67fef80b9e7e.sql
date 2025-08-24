-- Verificar a política RLS de UPDATE para pacientes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'pacientes' AND cmd = 'UPDATE';