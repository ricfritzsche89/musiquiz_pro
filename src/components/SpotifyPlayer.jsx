import React, { useState, useEffect } from 'react';

function SpotifyPlayer({ token }) {
  const [player, setPlayer] = useState(undefined);
  const [is_active, setActive] = useState(false);
  const [current_track, setTrack] = useState(undefined);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Musiquiz Pro Web Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });

      setPlayer(player);

      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      player.addListener('player_state_changed', (state => {
        if (!state) return;
        setTrack(state.track_window.current_track);
        player.getCurrentState().then( state => { 
          (!state)? setActive(false) : setActive(true) 
        });
      }));

      player.connect();
    };
  }, [token]);

  if (!is_active) {
    return (
      <div className="glass-panel" style={{ padding: '20px', marginTop: '20px' }}>
        <p>Verbinde mit Spotify Player...</p>
        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Tipp: Wähle "Musiquiz Pro Web Player" in deiner Spotify App unter "Verfügbare Geräte".</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '30px', marginTop: '20px', textAlign: 'center' }}>
      <img src={current_track?.album.images[0].url} alt="Album Art" style={{ width: '200px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
      <h2 style={{ margin: '0' }}>{current_track?.name}</h2>
      <p style={{ opacity: 0.7 }}>{current_track?.artists.map(artist => artist.name).join(', ')}</p>
      
      <div style={{ marginTop: '20px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <button onClick={() => player.previousTrack()} style={{ border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>⏮</button>
        <button onClick={() => player.togglePlay()} style={{ border: 'none', background: 'white', color: 'black', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', fontSize: '1.5rem' }}>⏯</button>
        <button onClick={() => player.nextTrack()} style={{ border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>⏭</button>
      </div>
    </div>
  );
}

export default SpotifyPlayer;
