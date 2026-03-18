import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';
import SpotifyPlayer from '../components/SpotifyPlayer';
import { migrateLocalDB } from '../utils/migrateDB';
import { supabase } from '../supabaseJS';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

function HostView({ token }) {
  const { session, players, updateSession } = useGameLogic('default');
  const [timer, setTimer] = useState(60);
  const [showAdmin, setShowAdmin] = useState(false);
  const [dbData, setDbData] = useState({ categories: [] });
  const [loading, setLoading] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatUrl, setNewCatUrl] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatUrl, setEditCatUrl] = useState('');
  const playerRef = useRef(null);
  
  // URL für Controller (GH Pages oder Local)
  const hostUrl = window.location.origin + window.location.pathname + "#/play";

  // Steuerung der Musik basierend auf Phase
  useEffect(() => {
    if (!session || !playerRef.current) return;

    if (session.phase === 'playing') {
      const currentSong = session.songs?.[session.current_song_index];
      if (currentSong?.spotify_uri) {
        playerRef.current.play(currentSong.spotify_uri);
      }
    } else if (session.phase === 'hotseat' || session.phase === 'results') {
      playerRef.current.pause();
    }
  }, [session?.phase, session?.current_song_index]);

  // Timer Effekt für Hotseat Phase (Analog zum Original)
  useEffect(() => {
    let interval = null;
    if (session?.phase === 'hotseat') {
      interval = setInterval(() => {
        setTimer(t => {
          if (t <= 0) return 0;
          return t - 1;
        });
      }, 1000);
    } else {
        setTimer(60);
    }
    return () => clearInterval(interval);
  }, [session?.phase]);

  // Daten aus Supabase laden für Admin
  useEffect(() => {
    const fetchDB = async () => {
      const { data: catData } = await supabase.from('categories').select('*, songs(*)');
      if (catData) setDbData({ categories: catData });
    };
    if (showAdmin) fetchDB();
  }, [showAdmin]);

  // KATEGORIE AKTIONEN
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const { error } = await supabase.from('categories').insert([{ 
        name: newCatName, 
        playlist_url: newCatUrl 
    }]);
    if (error) alert("Fehler: " + error.message);
    else { 
        setNewCatName(''); 
        setNewCatUrl('');
        fetchDB(); 
    }
  };

  const handleUpdateCategory = async (id) => {
    if (!editCatName.trim()) return;
    const { error } = await supabase.from('categories').update({ 
        name: editCatName,
        playlist_url: editCatUrl
    }).eq('id', id);
    if (error) alert("Fehler: " + error.message);
    else { setEditingCatId(null); fetchDB(); }
  };

  const handleDeleteCategory = async (id) => {
    if (confirm("Kategorie wirklich löschen? Alle zugehörigen Songs werden ebenfalls entfernt.")) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) alert("Fehler: " + error.message);
      else fetchDB();
    }
  };

  const fetchDB = async () => {
    const { data: catData } = await supabase.from('categories').select('*, songs(*)').order('name');
    if (catData) setDbData({ categories: catData });
  };

  const handleMigration = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (res) => {
      try {
        const dbContent = JSON.parse(res.target.result);
        const results = await migrateLocalDB(dbContent, token);
        alert(`Migration fertig! ${results.added} Songs hinzugefügt.`);
        fetchDB();
      } catch (err) {
        alert("Fehler beim Import: " + err.message);
      }
      setLoading(false);
      setShowAdmin(false);
    };
    reader.readAsText(file);
  };
  if (!session) return <div className="container" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color:'#fff'}}><h3>Initialisiere Musiquiz Pro...</h3></div>;

  // 1. LOBBY PHASE
  if (session.phase === 'lobby') {
    return (
      <div className="container" style={styles.container}>
        <button onClick={() => setShowAdmin(true)} style={styles.openAdminBtn}>⚙️ Settings</button>
        {showAdmin && (
            <div style={styles.adminOverlay}>
                <div className="glass-panel" style={styles.adminModal}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                        <h2>🛠️ Musiquiz Pro Management</h2>
                        <button onClick={() => setShowAdmin(false)} style={{background:'none', border:'none', color:'#fff', cursor:'pointer'}}>X</button>
                    </div>
                    
                    <div style={styles.adminScrollArea}>
                        {/* 1. NEUE KATEGORIE ANLEGEN */}
                        <div className="glass-panel" style={{padding:'20px', marginBottom:'20px', border:'1px solid var(--neon-purple)'}}>
                            <h3>🆕 Neue Kategorie</h3>
                            <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'10px'}}>
                                <input 
                                    type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                                    placeholder="Name (z.B. Disney)" style={{...styles.input, textAlign: 'left'}}
                                />
                                <input 
                                    type="text" value={newCatUrl} onChange={(e) => setNewCatUrl(e.target.value)}
                                    placeholder="Spotify Playlist URL (optional)" style={{...styles.input, textAlign: 'left'}}
                                />
                                <button onClick={handleAddCategory} style={{...styles.joinButton, width:'100%', background:'var(--neon-purple)', color:'#fff'}}>
                                    <Plus size={20} style={{verticalAlign:'middle', marginRight:'5px'}} /> Kategorie anlegen
                                </button>
                            </div>
                        </div>

                        {/* 2. IMPORT BOX */}
                        <div className="glass-panel" style={{padding:'20px', marginBottom:'20px', border:'1px dashed var(--neon-blue)'}}>
                            <h3>📦 Import: Alte Datenbank</h3>
                            <p style={{fontSize:'0.8rem', opacity:0.6, marginBottom:'10px'}}>Wähle deine `database.json` aus der originalen App.</p>
                            <input type="file" accept=".json" onChange={handleMigration} id="upload-db" style={{display:'none'}} />
                            <label htmlFor="upload-db" style={{...styles.playerBadge, cursor:'pointer', display:'inline-block', background:'var(--neon-blue)', color:'#000'}}>
                                {loading ? 'Lade...' : '📂 Datei auswählen'}
                            </label>
                        </div>

                        {/* 3. KATEGORIEN LISTE */}
                        <h3>Deine Quiz-Inhalte ({dbData.categories?.length || 0})</h3>
                        {dbData.categories?.map(cat => (
                            <div key={cat.id} style={{...styles.catItem, flexDirection:'column', alignItems:'flex-start', gap: '10px'}}>
                                {editingCatId === cat.id ? (
                                    <div style={{display:'flex', flexDirection: 'column', gap:'10px', width:'100%'}}>
                                        <input 
                                            type="text" value={editCatName} onChange={(e) => setEditCatName(e.target.value)}
                                            style={{...styles.input, textAlign: 'left', padding:'5px 10px'}}
                                        />
                                        <input 
                                            type="text" value={editCatUrl} onChange={(e) => setEditCatUrl(e.target.value)}
                                            placeholder="Playlist URL"
                                            style={{...styles.input, textAlign: 'left', padding:'5px 10px'}}
                                        />
                                        <div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
                                            <button onClick={() => handleUpdateCategory(cat.id)} style={{background:'none', border:'none', color:'#00ff73'}}><Check /></button>
                                            <button onClick={() => setEditingCatId(null)} style={{background:'none', border:'none', color:'#ff2a2a'}}><X /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{display:'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                                        <div>
                                            <strong>{cat.name}</strong> 
                                            <span style={{opacity:0.6, marginLeft:'10px', fontSize:'0.8rem'}}>({cat.songs?.length || 0} Songs)</span>
                                            {cat.playlist_url && (
                                                <div style={{fontSize:'0.7rem', color: 'var(--neon-blue)', marginTop: '5px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                                    🔗 {cat.playlist_url}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                            <button onClick={() => { 
                                                setEditingCatId(cat.id); 
                                                setEditCatName(cat.name); 
                                                setEditCatUrl(cat.playlist_url || '');
                                            }} style={styles.iconBtn}><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteCategory(cat.id)} style={{...styles.iconBtn, color:'#ff4444'}}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
        <div style={styles.logoContainer}>
            <img src="logo.png" alt="Musiquiz Pro" style={styles.headerLogo} />
        </div>
        
        <div className="glass-panel" style={styles.lobbyCard}>
          <h2>Tritt der Lobby bei!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Scanne den QR Code mit deinem Smartphone</p>
          
          <div style={styles.qrContainer}>
            <QRCodeSVG value={hostUrl} size={200} fgColor="#fff" bgColor="transparent" />
          </div>
          
          <p style={styles.urlText}>{hostUrl}</p>

          <div style={styles.playerList}>
            <h3>Wartende Spieler: {Object.keys(players).length}</h3>
            <div style={styles.players}>
              {Object.values(players).map((p) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={p.id} 
                  style={{...styles.playerBadge, borderColor: p.color}}
                >
                  {p.name}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. VOTING PHASE
  if (session.phase === 'voting') {
    const totalPlayers = Object.keys(players).length;
    const votesCount = Object.values(players).filter(p => p.vote).length;

    return (
      <div className="container" style={styles.container}>
        <h1 style={{fontSize: '3rem', marginBottom: '20px'}}>Kategorie <span style={{color: 'var(--neon-blue)'}}>Wahl</span></h1>
        <div style={styles.progressContainer}>
          <div style={{...styles.progressBar, width: `${(votesCount / totalPlayers) * 100}%`}}></div>
        </div>
        <p>{votesCount} von {totalPlayers} Spielern haben gewählt</p>

        <div style={styles.votesGrid}>
          {session.category_votes && Object.entries(session.category_votes).map(([cat, votes]) => (
            <div key={cat} className="glass-panel" style={styles.voteCard}>
              <h3>{cat}</h3>
              <h1 style={{color: 'var(--neon-purple)'}}>{votes}</h1>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. READY CHECK PHASE
  if (session.phase === 'readyCheck') {
    const totalPlayers = Object.keys(players).length;
    const readyPlayers = Object.values(players).filter(p => p.isReady).length;

    return (
      <div className="container" style={styles.container}>
        <motion.h1 
          animate={{ scale: [1, 1.05, 1], color: ['#fff', '#00ff73', '#fff'] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{fontSize: '4rem', marginBottom: '20px', textAlign: 'center'}}
        >
          Kategorie "{session.selected_category}" startet!
        </motion.h1>
        <div style={{...styles.progressContainer, marginTop: '50px', height: '40px', borderRadius: '20px'}}>
          <div style={{...styles.progressBar, background: '#00ff73', width: `${(readyPlayers / totalPlayers) * 100}%`}}></div>
        </div>
        <p style={{fontSize: '1.5rem'}}>{readyPlayers} von {totalPlayers} Spielern sind startklar</p>
      </div>
    );
  }

  // 4. PLAYING PHASE (Spotify SDK)
  if (session.phase === 'playing') {
    return (
      <div style={styles.gameContainer}>
        {/* Nativ Spotify Player als Herzstück (Eingebettet aber unsichtbar) */}
        <SpotifyPlayer ref={playerRef} token={token} />
        
        <div style={styles.overlay}>
           <div style={styles.waveVisualizer}>
            {[...Array(20)].map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: ['20px', `${Math.random() * 100 + 50}px`, '20px'] }}
                transition={{ duration: Math.random() + 0.5, repeat: Infinity, ease: "easeInOut" }}
                style={styles.waveBar}
              />
            ))}
          </div>
          <h1 style={{marginTop: '40px', fontSize: '3rem', textShadow: '0 0 20px var(--neon-blue)'}}>
            Song {session.current_song_index + 1} von {session.songs?.length || 5}
          </h1>
          <p style={{fontSize: '1.5rem', color: 'var(--text-muted)'}}>Wer buzzert zuerst?</p>
        </div>
      </div>
    );
  }

  // 5. HOTSEAT PHASE
  if (session.phase === 'hotseat') {
    const rater = players[session.rater_id];
    return (
      <div className="container" style={styles.container}>
        <motion.h1 
          animate={{ scale: [1, 1.1, 1], color: ['#fff', 'var(--neon-red)', '#fff'] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{fontSize: '5rem', marginBottom: '20px'}}
        >
          STOP!
        </motion.h1>
        
        {rater && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel" 
            style={{...styles.lobbyCard, borderColor: rater.color, borderWidth: '4px', boxShadow: `0 0 40px ${rater.color}`}}
          >
            <h2 style={{color: rater.color, fontSize: '4rem'}}>{rater.name}</h2>
            <p style={{fontSize: '1.8rem', marginTop: '10px', color: '#fff'}}>Am Drücker!</p>
          </motion.div>
        )}

        <div style={{marginTop: '40px', textAlign: 'center'}}>
          <div style={{...styles.timerBox, borderColor: timer < 10 ? '#ff2a2a' : '#fff', color: timer < 10 ? '#ff2a2a' : '#fff'}}>
            {timer}
          </div>
        </div>
      </div>
    );
  }

  // 6. RESULTS PHASE
  if (session.phase === 'results') {
    const rater = players[session.rater_id];
    const isCorrect = session.mc_correct;

    return (
      <div className="container" style={styles.container}>
        <div className="glass-panel" style={styles.resultsCard}>
          <h2 style={{color: 'var(--neon-purple)', marginBottom: '10px'}}>DIE LÖSUNG</h2>
          <h1 style={{fontSize: '3rem', marginBottom: '30px'}}>{session.songs[session.current_song_index]?.title || "Kein Titel"}</h1>

          {isCorrect ? (
            <div style={styles.successBox}>
              <h2 style={{color: '#00ff73', fontSize: '3.5rem'}}>GEWONNEN!</h2>
              <h3 style={{fontSize: '1.8rem'}}>{rater?.name} räumt 100 Punkte ab!</h3>
            </div>
          ) : (
            <div style={styles.failBox}>
              <h2 style={{color: '#ff2a2a', fontSize: '3rem'}}>DANEBEN!</h2>
              <p style={{fontSize: '1.5rem'}}>Tipp war: "{session.wrong_answer}"</p>
            </div>
          )}
          
          <div style={{marginTop: '30px'}}>
            <h3 style={{color: 'var(--text-muted)'}}>Warten auf Mitspieler...</h3>
            <div style={styles.players}>
                {Object.values(players).map(p => (
                    <div key={p.id} style={{...styles.playerBadge, opacity: p.nextSongReady ? 1 : 0.3, borderColor: p.nextSongReady ? '#00ff73' : '#fff'}}>
                        {p.name} {p.nextSongReady ? '✓' : ''}
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 7. RANKING PHASE
  if (session.phase === 'ranking') {
    const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);
    return (
      <div className="container" style={styles.container}>
        <h1 style={{...styles.logo, fontSize: '4rem'}}>🏆 FINAL RANKING 🏆</h1>
        <div style={{width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
          {sortedPlayers.map((p, index) => (
            <div key={p.id} className="glass-panel" style={{...styles.voteCard, width: '100%', flexDirection: 'row', padding: '20px 40px'}}>
              <h2 style={{fontSize: '2.5rem'}}>#{index + 1} {p.name}</h2>
              <h1 style={{fontSize: '3rem', color: 'var(--neon-blue)'}}>{p.score} PTS</h1>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

const styles = {
  container: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem'
  },
  logoContainer: {
    marginBottom: '2rem', display: 'flex', justifyContent: 'center'
  },
  headerLogo: {
    height: '180px', width: 'auto'
  },
  lobbyCard: {
    padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px'
  },
  qrContainer: {
    padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', marginBottom: '1rem'
  },
  urlText: { color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' },
  playerList: { width: '100%', textAlign: 'center' },
  players: { display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '15px' },
  playerBadge: { padding: '8px 16px', borderRadius: '20px', border: '2px solid', background: 'rgba(0,0,0,0.3)', fontWeight: 'bold' },
  progressContainer: { width: '500px', height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', margin: '30px 0 10px 0', overflow: 'hidden' },
  progressBar: { height: '100%', background: 'linear-gradient(90deg, var(--neon-purple), var(--neon-blue))', transition: 'width 0.5s' },
  votesGrid: { display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', maxWidth: '800px', marginTop: '40px' },
  voteCard: { width: '200px', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  gameContainer: { width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#000' },
  overlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, background: 'rgba(10,10,15,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  waveVisualizer: { display: 'flex', alignItems: 'flex-end', gap: '10px', height: '150px' },
  waveBar: { width: '20px', background: 'var(--neon-blue)', borderRadius: '10px', boxShadow: '0 0 15px var(--neon-blue)' },
  timerBox: { fontSize: '6rem', fontWeight: 'bold', border: '5px solid white', borderRadius: '20px', padding: '20px 40px', background: 'rgba(0,0,0,0.5)' },
  resultsCard: { padding: '50px', textAlign: 'center', width: '90%', maxWidth: '900px' },
  successBox: { padding: '30px', border: '2px solid #00ff73', borderRadius: '25px', background: 'rgba(0,255,115,0.05)' },
  failBox: { padding: '30px', border: '2px solid #ff2a2a', borderRadius: '25px', background: 'rgba(255,42,42,0.05)' },
  openAdminBtn: {
    position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(255,255,255,0.1)',
    border: 'none', color: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', zIndex: 50
  },
  adminOverlay: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.9)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  adminModal: {
    background: '#1a1a24', width: '90%', maxWidth: '800px', maxHeight: '90vh',
    borderRadius: '20px', padding: '30px', border: '1px solid var(--neon-purple)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 0 50px rgba(188, 19, 254, 0.3)'
  },
  adminScrollArea: {
    flex: 1, overflowY: 'auto', paddingRight: '15px', minHeight: 0,
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--neon-purple) rgba(0,0,0,0.2)'
  },
  catItem: {
    padding: '15px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', 
    marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    border: '1px solid rgba(255,255,26,0.1)'
  },
  iconBtn: {
    background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.6,
    transition: 'opacity 0.2s', padding: '5px'
  },
  input: {
    width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(0,0,0,0.5)', color: 'white'
  },
  joinButton: {
    padding: '12px 25px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer'
  }
};

export default HostView;
