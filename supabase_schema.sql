-- ==========================================
-- CampusConnect Supabase Schema
-- Copy and paste this into your Supabase SQL Editor
-- ==========================================

-- 1. Create Profiles Table (Linked to Auth)
CREATE TABLE public.profiles (
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

-- Allow public read access to all profiles (for Discover page)
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

-- Allow users to update their own profile (Settings page)
CREATE POLICY "Users can insert their own profile." 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- 2. Create Jobs/Posts Table
CREATE TABLE public.posts (
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
CREATE POLICY "Posts are viewable by everyone." ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts." ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);


-- 3. Create Messages Table
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own messages." ON public.messages 
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages." ON public.messages 
FOR INSERT WITH CHECK (auth.uid() = sender_id);


-- 4. Create Events Table
CREATE TABLE public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organizer_id UUID REFERENCES public.profiles(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
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
