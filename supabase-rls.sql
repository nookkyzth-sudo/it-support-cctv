-- Run this in Supabase SQL Editor

-- Grant table privileges (required because tables were created via Prisma)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Enable RLS on tables, but keep users table unrestricted to avoid recursion with auth/user lookups
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own" ON users;
DROP POLICY IF EXISTS "users_select" ON users;

-- Branches
DROP POLICY IF EXISTS "branches_all" ON branches;
CREATE POLICY "branches_all" ON branches FOR ALL USING (true) WITH CHECK (true);

-- Categories
DROP POLICY IF EXISTS "categories_all" ON categories;
CREATE POLICY "categories_all" ON categories FOR ALL USING (true) WITH CHECK (true);

-- Tickets
DROP POLICY IF EXISTS "tickets_all" ON tickets;
CREATE POLICY "tickets_all" ON tickets FOR ALL USING (true) WITH CHECK (true);

-- Attachments
DROP POLICY IF EXISTS "attachments_all" ON ticket_attachments;
CREATE POLICY "attachments_all" ON ticket_attachments FOR ALL USING (true) WITH CHECK (true);

-- Logs
DROP POLICY IF EXISTS "logs_all" ON ticket_logs;
CREATE POLICY "logs_all" ON ticket_logs FOR ALL USING (true) WITH CHECK (true);

-- Trigger: auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (user_id, name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', new.email), 'staff');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
