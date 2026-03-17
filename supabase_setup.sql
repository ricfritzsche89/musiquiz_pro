-- MUSIQUIZ PRO - DATABASE SCHEMA

-- 1. Kategorien Tabelle
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
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
    id TEXT PRIMARY KEY, -- z.B. 'default' oder ein Raum-Code
    phase TEXT DEFAULT 'lobby',
    current_song_index INTEGER DEFAULT 0,
    rater_id TEXT,
    players JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Realtime aktivieren (Wichtig für die Live-Synchronisation)
-- Dieser Befehl erstellt die Publikation, falls sie nicht existiert, 
-- und fügt alle unsere Tabellen hinzu. 
-- Das ersetzt den Klick im Dashboard!

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.categories, public.songs, public.game_sessions;
COMMIT;
