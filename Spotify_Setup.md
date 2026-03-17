# Spotify Developer Setup für Musiquiz Pro

Damit wir Spotify direkt im Browser abspielen können, brauchen wir eine "Spotify App". Das geht schnell:

1.  **Dashboard aufrufen:** Gehe auf [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard).
2.  **App erstellen:** Klicke auf "Create App".
    -   **Name:** Musiquiz Pro (oder was dir gefällt)
    -   **Redirect URIs:** `http://localhost:5173/` (Wichtig für die lokale Entwicklung!) und später deine GitHub Pages URL (z.B. `https://deinname.github.io/Musiquiz/`).
3.  **Settings:** In den Einstellungen deiner neuen App findest du die **Client ID**. Diese brauchen wir gleich.
4.  **Web Playback SDK:** Die App wird das Spotify SDK nutzen, um Lieder direkt auf dem Laptop abzuspielen.

**Für Supabase:**
-   Erstelle ein neues Projekt.
-   Kopiere den Inhalt der `supabase_setup.sql` in den SQL Editor und führe ihn aus.
-   Aktiviere unter **Database -> Replication** bei der Tabelle `game_sessions` den "Realtime" Schalter.
