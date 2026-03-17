// Spotify OAuth Konfiguration
const authEndpoint = "https://accounts.spotify.com/authorize";
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

// Erkennt automatisch, ob wir auf GitHub Pages oder lokal sind
const redirectUri = window.location.origin + window.location.pathname; 

// Benötigte Berechtigungen (Scopes) für den Web Player
const scopes = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-library-read",
  "user-library-modify",
  "user-read-playback-state",
  "user-modify-playback-state",
];

export const loginUrl = `${authEndpoint}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
  redirectUri
)}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`;

export const getTokenFromUrl = () => {
  return window.location.hash
    .substring(1)
    .split("&")
    .reduce((initial, item) => {
      let parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
      return initial;
    }, {});
};
