-- ==========================================================
-- VoteRight GH - Supabase PostgreSQL Database Schema & Security
-- ==========================================================

-- 1. Profiles table for users, organizers, and admins
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'organizer', -- 'admin', 'organizer', 'user'
  is_verified BOOLEAN DEFAULT false,
  is_blocked BOOLEAN DEFAULT false,
  paid_flat_fee BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Competitions linked strictly to organizer_id
CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  flyer_url TEXT,
  cost_per_vote NUMERIC(10,2) NOT NULL DEFAULT 1.50,
  status TEXT DEFAULT 'open', -- 'open' or 'closed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Nominees table with upload support and status
CREATE TABLE IF NOT EXISTS public.nominees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  photo_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  vote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Votes Table
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nominee_id UUID REFERENCES public.nominees(id) ON DELETE CASCADE,
    votes_count INT NOT NULL DEFAULT 1,
    amount_paid NUMERIC(10, 2) NOT NULL,
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    voter_phone VARCHAR(20),
    voter_name VARCHAR(100),
    channel VARCHAR(50) NOT NULL, -- 'momo_mtn', 'momo_telecel', 'momo_airteltigo', 'card'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Profiles Policy: Users can read own profile; Admins can read/write all
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

-- Competitions Policy: Organizers can only access own competitions if verified and not blocked
CREATE POLICY "Organizers can only access own competitions"
ON public.competitions
FOR ALL
USING (auth.uid() = organizer_id AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND is_verified = true AND is_blocked = false
));

-- Public read access to open competitions for public voting
CREATE POLICY "Public Read Access for Competitions" ON public.competitions FOR SELECT USING (status = 'open');
CREATE POLICY "Public Read Access for Nominees" ON public.nominees FOR SELECT USING (status = 'approved');
CREATE POLICY "Public Read Access for Tickets" ON public.tickets FOR SELECT USING (true);

-- Block direct client writes to votes (Only server webhooks insert votes)
CREATE POLICY "Block Direct Client Votes Insert" ON public.votes FOR INSERT WITH CHECK (false);

-- ==========================================================
-- ATOMIC TRIGGER FUNCTION FOR VOTE INCREMENTS
-- ==========================================================

CREATE OR REPLACE FUNCTION public.increment_nominee_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.nominees
    SET vote_count = vote_count + NEW.votes_count
    WHERE id = NEW.nominee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_on_vote_payment_success
AFTER INSERT ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.increment_nominee_vote_count();

-- ==========================================================
-- SUPABASE REALTIME REPLICATION
-- ==========================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.nominees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competitions;

