ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own" ON public.users;
DROP POLICY IF EXISTS "users_select" ON public.users;
