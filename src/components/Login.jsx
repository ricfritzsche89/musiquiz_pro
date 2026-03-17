import React from 'react';
import { redirectToAuthCodeFlow } from '../spotify';

function Login() {
  const handleLogin = (e) => {
    e.preventDefault();
    redirectToAuthCodeFlow();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
      <h2 style={{ color: 'white', letterSpacing: '2px' }}>Bereit fürs Pro-Quiz?</h2>
      <button 
        onClick={handleLogin}
        style={{
          padding: '1.2rem 2.5rem',
          backgroundColor: '#1DB954',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '50px',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          boxShadow: '0 10px 30px rgba(29, 185, 84, 0.3)',
          transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        LOGIN MIT SPOTIFY PREMIUM
      </button>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
        Hinweis: Nur der Host benötigt Spotify Premium zum Abspielen.
      </p>
    </div>
  );
}

export default Login;
