import { supabase } from '../supabaseJS';

export const migrateLocalDB = async (dbContent, spotifyToken) => {
  const categories = Object.values(dbContent.categories);
  const results = { added: 0, failed: 0 };

  for (const cat of categories) {
    // 1. Kategorie in Supabase anlegen
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .upsert({ name: cat.name }, { onConflict: 'name' })
      .select()
      .single();

    if (catError) {
      console.error(`Fehler bei Kategorie ${cat.name}:`, catError);
      continue;
    }

    // 2. Songs der Kategorie verarbeiten
    for (const song of cat.songs) {
      try {
        // Optionale Spotify Suche
        let spotifyUri = null;
        if (spotifyToken) {
          const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(song.title)}&type=track&limit=1`, {
            headers: { 'Authorization': `Bearer ${spotifyToken}` }
          });
          const searchData = await searchRes.json();
          spotifyUri = searchData.tracks?.items[0]?.uri;
        }

        const { error: songError } = await supabase
          .from('songs')
          .upsert({
            category_id: catData.id,
            title: song.title,
            youtube_id: song.id, // Das Feld heißt im Original 'id'
            spotify_id: spotifyUri // Mapping auf Spotify Native
          });

        if (songError) results.failed++;
        else results.added++;
      } catch (e) {
        results.failed++;
      }
    }
  }

  return results;
};
