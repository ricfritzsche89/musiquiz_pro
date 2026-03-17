-- 1. Tabellen & Spalten (Idempotent)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Falls playlist_url noch nicht existiert
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS playlist_url TEXT;

CREATE TABLE IF NOT EXISTS public.songs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    spotify_id TEXT,
    youtube_id TEXT,
    title TEXT NOT NULL,
    artist TEXT,
    album_cover TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- 2. Security (RLS) & Realtime
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Policies sicher anlegen (löschen falls vorhanden)
DROP POLICY IF EXISTS "Allow all for anon" ON public.game_sessions;
CREATE POLICY "Allow all for anon" ON public.game_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon" ON public.categories;
CREATE POLICY "Allow all for anon" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon" ON public.songs;
CREATE POLICY "Allow all for anon" ON public.songs FOR ALL USING (true) WITH CHECK (true);

-- Realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.categories, public.songs, public.game_sessions;
COMMIT;
