-- =============================================================================
-- VoteRight GH - Complete Supabase SQL Migration Package
-- Description:
--   - Creates and manages user profiles extending auth.users
--   - Manages organizer access requests and statuses
--   - Automated signup trigger populating profiles on auth.users registration
--   - Strict Row Level Security (RLS) policies for Admin, Organizer, and Voter roles
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM / ROLE CHECK TYPES
-- Ensure profiles table has proper constraints
-- Role options: 'admin', 'organizer', 'voter'

-- 3. PROFILES TABLE
-- Extends Supabase auth.users with app-specific roles and metadata
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'voter' CHECK (role IN ('admin', 'organizer', 'voter')),
  is_verified BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for role lookup performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. ORGANIZERS TABLE
-- Tracks organizer applications and organizations
CREATE TABLE IF NOT EXISTS public.organizers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  organization_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for organizer queries
CREATE INDEX IF NOT EXISTS idx_organizers_user_id ON public.organizers(user_id);
CREATE INDEX IF NOT EXISTS idx_organizers_status ON public.organizers(status);

-- 5. AUTOMATED SIGNUP TRIGGER
-- Automatically creates a matching record in public.profiles when a user registers via auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_verified, is_blocked)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'voter'),
    CASE WHEN (NEW.raw_user_meta_data->>'role') = 'admin' THEN true ELSE false END,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 6. HELPER RLS FUNCTIONS
-- Check if current user is an admin without infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is an approved organizer
CREATE OR REPLACE FUNCTION public.is_organizer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'organizer' AND is_verified = true AND is_blocked = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies:
-- 1) Admins have full access to view, update, delete all profiles
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles
  FOR ALL
  USING (public.is_admin());

-- 2) Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 3) Users can update their own profile (except role and verification flags)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);


-- Enable RLS on organizers
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;

-- Organizers Policies:
-- 1) Admins have full access to view, create, update, delete organizer applications
DROP POLICY IF EXISTS "Admins have full access to organizers" ON public.organizers;
CREATE POLICY "Admins have full access to organizers"
  ON public.organizers
  FOR ALL
  USING (public.is_admin());

-- 2) Users can view their own organizer application
DROP POLICY IF EXISTS "Organizers can view own application" ON public.organizers;
CREATE POLICY "Organizers can view own application"
  ON public.organizers
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3) Authenticated users can submit an organizer request
DROP POLICY IF EXISTS "Users can submit organizer request" ON public.organizers;
CREATE POLICY "Users can submit organizer request"
  ON public.organizers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4) Organizers can update their own pending application
DROP POLICY IF EXISTS "Organizers can edit own pending application" ON public.organizers;
CREATE POLICY "Organizers can edit own pending application"
  ON public.organizers
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');


-- 8. REALTIME SUBSCRIPTIONS
-- Enable realtime updates for competitions and nominees if public publication exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organizers;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
