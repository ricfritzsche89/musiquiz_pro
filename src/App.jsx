import React, { useState, useEffect } from 'react';
import { getTokenFromUrl } from './spotify';
import { supabase } from './supabaseJS';
import Login from './components/Login';
import SpotifyPlayer from './components/SpotifyPlayer';
import './index.css';

function App() {
  const [token, setToken] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 1. Spotify Token aus URL extrahieren
    const hash = getTokenFromUrl();
    window.location.hash = "";
    const _token = hash.access_token;

    if (_token) {
      setToken(_token);
      localStorage.setItem("spotify_token", _token);
    } else {
      const savedToken = localStorage.getItem("spotify_token");
      if (savedToken) setToken(savedToken);
    }

    // 2. Supabase Realtime Session abonnieren
    const channel = supabase.channel('musiquiz_game')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions' }, (payload) => {
        setSession(payload.new);
        console.log("Game Session Update:", payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="app-container" style={{ textAlign: 'center', padding: '50px', background: '#0f0c29', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <header style={{ marginBottom: '50px' }}>
        <h1 style={{ color: '#00d2ff', fontSize: '3.5rem', margin: '0', textShadow: '0 0 20px rgba(0,210,255,0.5)' }}>Musiquiz <span style={{ color: '#fff' }}>PRO</span></h1>
        <p style={{ opacity: 0.6, letterSpacing: '2px' }}>CLOUD SYNC & NATIVE AUDIO</p>
      </header>

      {!token ? (
        <Login />
      ) : (
        <div style={{ width: '100%', maxWidth: '800px' }}>
          <SpotifyPlayer token={token} />
          
          <div className="glass-panel" style={{ marginTop: '30px', padding: '30px' }}>
            <h3 style={{ color: '#00ff73' }}>
              {session?.phase === 'lobby' ? 'Warte auf Mitspieler...' : 'Spiel läuft'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginTop: '20px' }}>
              {/* Hier kommen später die Player-Cards hin */}
              <div className="glass-panel" style={{ padding: '15px', border: '1px dashed #00d2ff' }}>
                <p>Host: Startbereit ✔</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => { localStorage.removeItem("spotify_token"); setToken(null); }}
            style={{ marginTop: '40px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '10px 20px', borderRadius: '10px' }}
          >
            Logout Spotify
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
