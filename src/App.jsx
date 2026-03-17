import React from 'react'

function App() {
  return (
    <div style={{ textAlign: 'center', padding: '50px', background: '#0f0c29', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ color: '#00d2ff', fontSize: '3rem', marginBottom: '20px' }}>Musiquiz Pro</h1>
      <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)' }}>Supabase & Spotify Native Edition</p>
      <div style={{ marginTop: '40px', padding: '30px', border: '1px solid rgba(0,210,255,0.3)', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
        <h3 style={{ color: '#00ff73' }}>Status: Cloud-Ready 🚀</h3>
        <p style={{ marginTop: '10px' }}>Datenbank: Supabase (vyogk...)</p>
        <p>Audio: Spotify Native SDK</p>
      </div>
    </div>
  )
}

export default App
