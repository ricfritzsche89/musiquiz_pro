import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

const SpotifyPlayer = forwardRef(({ token, currentSongId, onReady }, ref) => {
  const [player, setPlayer] = useState(undefined);
  const [is_active, setActive] = useState(false);
  const [deviceId, setDeviceId] = useState(null);

  useImperativeHandle(ref, () => ({
    pause: () => player?.pause(),
    resume: () => player?.resume(),
    play: (spotifyUri) => {
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [spotifyUri] }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
    }
  }));

  useEffect(() => {
    const initPlayer = () => {
      if (!window.Spotify) return;
      
      const player = new window.Spotify.Player({
        name: 'Musiquiz Pro Host',
        getOAuthToken: cb => { cb(token); },
        volume: 0.8
      });

      setPlayer(player);

      player.addListener('ready', ({ device_id }) => {
        console.log('Spotify Ready:', device_id);
        setDeviceId(device_id);
        setActive(true);
        if (onReady) onReady(device_id);
      });

      player.addListener('player_state_changed', state => {
        if (!state) return;
      });

      player.connect();
    };

    if (window.spotifySDKReady) {
      initPlayer();
    } else {
      window.addEventListener('spotifySDKReady', initPlayer);
    }

    return () => {
      window.removeEventListener('spotifySDKReady', initPlayer);
    };
  }, [token]);

  if (!is_active) {
    return (
      <div className="glass-panel" style={{ padding: '20px', position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000, maxWidth: '300px' }}>
        <p style={{fontSize: '0.9rem'}}>⏳ Spotify Player wird initialisiert...</p>
        <p style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '5px' }}>Falls es hakt: Prüfe ob Spotify auf diesem Laptop geöffnet ist.</p>
      </div>
    );
  }

  return null; // Im Spiel-Modus ist der Player unsichtbar
});

export default SpotifyPlayer;
