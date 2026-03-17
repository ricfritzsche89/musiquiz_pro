-- MUSIQUIZ PRO - DATABASE SCHEMA

-- 1. Kategorien Tabelle
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    playlist_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Songs Tabelle
CREATE TABLE IF NOT EXISTS public.songs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    spotify_id TEXT, -- Für das Native SDK
    youtube_id TEXT, -- Fallback / Hybrid
    title TEXT NOT NULL,
    artist TEXT,
    album_cover TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Game Session (Realtime State)
-- Wir nutzen eine Tabelle für den globalen State, den Realtime synchronisiert
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id TEXT PRIMARY KEY, 
    phase TEXT DEFAULT 'lobby',
    current_song_index INTEGER DEFAULT 0,
    rater_id TEXT,
    players JSONB DEFAULT '{}'::jsonb,
    category_votes JSONB DEFAULT '{}'::jsonb,
    selected_category TEXT,
    songs JSONB DEFAULT '[]'::jsonb,
    mc_options JSONB DEFAULT '[]'::jsonb,
    mc_correct BOOLEAN,
    wrong_answer TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Realtime & Security
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Policies für anonymen Zugriff (Wichtig!)
CREATE POLICY "Allow all for anon" ON public.game_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.songs FOR ALL USING (true) WITH CHECK (true);

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.categories, public.songs, public.game_sessions;
COMMIT;
