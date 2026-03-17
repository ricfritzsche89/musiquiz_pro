# 🛠️ Supabase Schritt-für-Schritt Anleitung

Befolge diese Schritte, um dein Backend für **Musiquiz Pro** vorzubereiten:

### 1. Projekt Erstellen
1. Logge dich auf [supabase.com](https://supabase.com) ein.
2. Klicke auf **"New Project"**.
3. Wähle deine Organisation, gib dem Projekt einen Namen (z.B. `Musiquiz Pro`) und lege ein sicheres Datenbank-Passwort fest.
4. Klicke auf **"Create new project"** und warte kurz, bis die Datenbank bereit ist.

### 2. Tabellen Erstellen (SQL Editor)
1. Klicke links in der Seitenleiste auf den **"SQL Editor"** (das Icon mit `>_`).
2. Klicke auf **"New query"**.
3. Öffne die Datei [supabase_setup.sql](file:///c:/Users/Fritzhoff/Desktop/Ric/Programmieren/Apps/Musiquiz/Musiquiz_Pro/supabase_setup.sql) auf deinem Rechner.
4. Kopiere den gesamten Text und füge ihn im Supabase SQL Editor ein.
5. Klicke unten rechts auf **"Run"**. Es sollte die Meldung "Success. No rows returned" erscheinen.

### 3. Echtzeit (Realtime) ist AUTOMATISCH aktiv
Gute Nachricht: Da ich das SQL-Skript oben angepasst habe, musst du **nichts mehr manuell** in den Menüs suchen! Der SQL-Befehl am Ende der Datei erledigt die Aktivierung von Realtime für dich.

*Du kannst den Schritt "Replication" also ignorieren!* 😉

### 4. API-Zugangsdaten finden
Damit ich die App programmieren kann, brauchen wir die Zugangsdaten:
1. Klicke links auf **"Project Settings"** (Zahnrad-Icon).
2. Klicke auf **"API"**.
3. Kopiere die **Project URL** (endet meist auf `.supabase.co`).
4. Kopiere den **anon / public** Key.
5. *(Optional)* Trage beides in eine neue Datei `.env` im Ordner `Musiquiz_Pro` ein oder schick sie mir hier im Chat.

### 5. URL-Konfig (für GitHub Pages)
Wenn du später online spielst:
1. Gehe in den Settings auf **"Authentication"**.
2. Scrolle zu **"URL Configuration"**.
3. Trage bei **"Site URL"** deine spätere GitHub Pages Adresse ein (z.B. `https://deinname.github.io/Musiquiz/`).

---
**Fertig!** Sobald das erledigt ist, bin ich bereit, den Code umzubauen. 🚀
