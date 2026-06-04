-- ==========================================
-- CampusConnect Supabase Schema (Idempotent / Repeatable)
-- Copy and paste this into your Supabase SQL Editor
-- ==========================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Profiles Table (Linked to Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'alumni', 'recruiter')),
    bio TEXT,
    headline TEXT,
    graduation_year INTEGER,
    avatar_url TEXT,
    resume_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent duplicate errors
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- Allow public read access to all profiles (for Discover page)
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

-- Allow users to update their own profile (Settings page)
CREATE POLICY "Users can insert their own profile." 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- 2. Create Jobs/Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    author_id UUID REFERENCES public.profiles(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('update', 'job', 'referral', 'project')),
    content TEXT NOT NULL,
    tags TEXT[], -- Array of strings like ['React', 'Internship']
    company TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public.posts;
DROP POLICY IF EXISTS "Users can create posts." ON public.posts;

CREATE POLICY "Posts are viewable by everyone." ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts." ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);


-- 3. Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages." ON public.messages;
DROP POLICY IF EXISTS "Users can send messages." ON public.messages;

CREATE POLICY "Users can view their own messages." ON public.messages 
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages." ON public.messages 
FOR INSERT WITH CHECK (auth.uid() = sender_id);


-- 4. Create Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organizer_id UUID REFERENCES public.profiles(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events are viewable by everyone." ON public.events;
DROP POLICY IF EXISTS "Only Recruiter and Alumni can create events." ON public.events;

CREATE POLICY "Events are viewable by everyone." ON public.events FOR SELECT USING (true);
CREATE POLICY "Only Recruiter and Alumni can create events." ON public.events 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('alumni', 'recruiter'))
);


-- ==========================================
-- Optional: Setup Storage Buckets for Avatars & Resumes
-- ==========================================
-- Note: You can also create these manually in the Supabase Dashboard UI -> Storage -> "New Bucket"
-- Name the buckets: "avatars" and "resumes" and make "avatars" Public.

-- ==========================================
-- 5. Trigger to automatically create profile on signup
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, headline, graduation_year, bio, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'headline',
    (new.raw_user_meta_data->>'graduation_year')::integer,
    new.raw_user_meta_data->>'bio',
    'https://api.dicebear.com/7.x/initials/svg?seed=' || COALESCE(new.raw_user_meta_data->>'full_name', 'New User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 6. Create Feedback Table (Public Anonymous Inserts allowed)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    course TEXT,
    branch TEXT,
    semester TEXT,
    category TEXT CHECK (category IN ('suggestion', 'bug', 'other')),
    details TEXT NOT NULL,
    rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (since visitors aren't logged in when submitting feedback)
DROP POLICY IF EXISTS "Anyone can insert feedback." ON public.feedback;
CREATE POLICY "Anyone can insert feedback." ON public.feedback FOR INSERT WITH CHECK (true);

-- Allow public read of feedback so testimonials can load dynamically
DROP POLICY IF EXISTS "Anyone can read feedback." ON public.feedback;
CREATE POLICY "Anyone can read feedback." ON public.feedback FOR SELECT USING (true);

-- Seed initial default feedbacks if they don't exist
INSERT INTO public.feedback (name, course, branch, semester, category, details, rating)
SELECT 'Priya Sharma', 'IIT Delhi', 'Final Year', '', 'suggestion', 'Found my startup co-founder through CampusConnect within a week. This platform changed everything for me. The matching algorithm is spot on.', 5
WHERE NOT EXISTS (SELECT 1 FROM public.feedback WHERE name = 'Priya Sharma');

INSERT INTO public.feedback (name, course, branch, semester, category, details, rating)
SELECT 'Arjun Mehta', 'BITS Pilani', '3rd Year', '', 'suggestion', 'Got my first internship through the alumni board here. The network is incredibly active and supportive. Highly recommend to freshers.', 5
WHERE NOT EXISTS (SELECT 1 FROM public.feedback WHERE name = 'Arjun Mehta');

INSERT INTO public.feedback (name, course, branch, semester, category, details, rating)
SELECT 'Sneha Rao', 'VIT Vellore', '2nd Year', '', 'suggestion', 'I was struggling to find teammates for my hackathon. Within 24 hours of posting on CampusConnect, I had a full team. Absolutely brilliant.', 5
WHERE NOT EXISTS (SELECT 1 FROM public.feedback WHERE name = 'Sneha Rao');
