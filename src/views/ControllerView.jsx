import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameLogic } from '../hooks/useGameLogic';

const COLORS = ['#ff2a2a', '#00d2ff', '#b026ff', '#00ff73', '#ffd700', '#ff007f'];

function ControllerView() {
  const { session, players, joinGame, voteCategory, submitBuzzer, submitMC, readyNextSong } = useGameLogic('default');
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [joined, setJoined] = useState(false);
  const [myId] = useState(() => 'p' + Math.random().toString(36).substr(2, 9));

  // Vibration Hilfsfunktion
  const vibrate = (pattern) => {
    if (window.navigator.vibrate) window.navigator.vibrate(pattern);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (name.trim() === '') return;
    joinGame({ id: myId, name, color, score: 0, isAdmin: name.toLowerCase() === 'ric' });
    setJoined(true);
  };

  if (!session) return <div className="container" style={styles.container}>Verbinde...</div>;

  // 1. PROFIL EINGABE
  if (!joined) {
    return (
      <div className="container" style={styles.container}>
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel" style={styles.card}>
          <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>MusiQuiz <span style={{color: 'var(--neon-blue)'}}>Join</span></h1>
          <form onSubmit={handleJoin} style={styles.form}>
            <input 
              type="text" placeholder="Dein Name" value={name} onChange={(e) => setName(e.target.value)}
              style={styles.input} maxLength={12}
            />
            <div style={styles.colorPicker}>
              {COLORS.map((c) => (
                <div 
                  key={c} onClick={() => setColor(c)}
                  style={{...styles.colorCircle, backgroundColor: c, border: color === c ? '3px solid white' : 'none', transform: color === c ? 'scale(1.2)' : 'none'}}
                />
              ))}
            </div>
            <button type="submit" style={styles.joinButton}>BEITRETEN</button>
          </form>
        </motion.div>
      </div>
    );
  }

  // WARTEN (Lobby)
  if (session.phase === 'lobby') {
    const isMeAdmin = players[myId]?.isAdmin;
    return (
      <div className="container" style={styles.container}>
        <div className="glass-panel" style={styles.waitingCard}>
          <h2 style={{ color }}>{name}</h2>
          {isMeAdmin ? (
            <div style={{marginTop: '20px'}}>
              <p style={{marginBottom: '15px'}}>Königliche Hoheit, starte das Spiel!</p>
              <button 
                onClick={() => useGameLogic().updateSession({ phase: 'voting'})} 
                style={{...styles.joinButton, width: '100%', background: 'linear-gradient(45deg, var(--neon-purple), var(--neon-blue))', color: 'white'}}
              >
                SPIEL STARTEN
              </button>
            </div>
          ) : (
            <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>Warten auf den Host (Ric)...</p>
          )}
        </div>
      </div>
    );
  }

  // 2. KATEGORIE VOTING
  if (session.phase === 'voting') {
    const myVote = players[myId]?.vote;
    if (myVote) {
      return (
        <div className="container" style={styles.container}>
          <div className="glass-panel" style={styles.waitingCard}>
            <h2>Wahl gebucht!</h2>
            <p style={{marginTop: '10px'}}>Kategorie: <strong style={{color: 'var(--neon-blue)'}}>{myVote}</strong></p>
          </div>
        </div>
      );
    }
    return (
      <div className="container" style={{...styles.container, padding: '10px'}}>
        <h2 style={{textAlign: 'center', marginBottom: '20px'}}>Wähle eine Kategorie</h2>
        <div style={styles.votingGrid}>
          {(session.categories || ['Quiz', 'Challenges']).map((cat) => (
            <div key={cat} onClick={() => { vibrate(50); voteCategory(myId, cat); }} className="glass-panel" style={styles.voteBtn}>
              {cat}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. READY CHECK
  if (session.phase === 'readyCheck') {
    const isReady = players[myId]?.isReady;
    if (isReady) return (
        <div className="container" style={styles.container}>
            <div className="glass-panel" style={styles.waitingCard}><h2>Bereit!</h2></div>
        </div>
    );
    return (
      <div className="container" style={styles.container}>
        <button 
            onClick={() => { vibrate(50); useGameLogic().updateSession({ players: {...players, [myId]: {...players[myId], isReady: true}} }); }} 
            className="glass-panel" style={{...styles.joinButton, width: '100%', background: '#00ff73', color: '#000'}}
        >
          ICH BIN BEREIT!
        </button>
      </div>
    );
  }

  // 4. PLAYING (BUZZER)
  if (session.phase === 'playing') {
    return (
      <div className="container" style={styles.container}>
        <motion.button 
          whileTap={{ scale: 0.9 }} onClick={() => { vibrate([100, 50, 100]); submitBuzzer(myId); }}
          style={styles.hotButton}
        >
          BUZZ
        </motion.button>
      </div>
    );
  }

  // 5. HOTSEAT (Multiple Choice)
  if (session.phase === 'hotseat') {
    const isRater = session.rater_id === myId;
    if (isRater) {
      return (
        <div className="container" style={styles.container}>
          <div style={{width: '100%'}}>
            <h2 style={{color: 'var(--neon-purple)', textAlign: 'center', marginBottom: '20px'}}>SCHNELL RATEN!</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              {(session.mc_options || []).map((opt) => (
                <button 
                    key={opt} onClick={() => { vibrate(50); submitMC(myId, opt, opt === session.songs[session.current_song_index]?.title); }} 
                    style={styles.mcButton}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="container" style={styles.container}>
        <div className="glass-panel" style={styles.waitingCard}>
          <h2>{players[session.rater_id]?.name} ist dran!</h2>
        </div>
      </div>
    );
  }

  // 6. RESULTS
  if (session.phase === 'results') {
    const isReady = players[myId]?.nextSongReady;
    return (
      <div className="container" style={styles.container}>
        <div className="glass-panel" style={{...styles.waitingCard, borderColor: isReady ? '#00ff73' : 'rgba(255,255,255,0.2)'}}>
          <h2 style={{color: isReady ? '#00ff73' : '#fff'}}>{isReady ? 'Bereit!' : 'Runde beendet'}</h2>
          {!isReady && (
            <button onClick={() => { vibrate(50); readyNextSong(myId); }} style={{...styles.joinButton, width: '100%', background: '#00ff73'}}>
              NÄCHSTER SONG ➔
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={styles.container}>
      <h2>Phase: {session.phase}</h2>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' },
  card: { padding: '30px', width: '100%', maxWidth: '400px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  input: { width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '1.2rem', textAlign: 'center' },
  colorPicker: { display: 'flex', justifyContent: 'space-between', padding: '10px 0' },
  colorCircle: { width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', transition: 'transform 0.2s' },
  joinButton: { padding: '15px', fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '15px', border: 'none', background: 'white', color: 'black', cursor: 'pointer', marginTop: '10px' },
  waitingCard: { padding: '40px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.2)', width: '100%', maxWidth: '400px' },
  votingGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', width: '100%' },
  voteBtn: { height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', cursor: 'pointer' },
  hotButton: { width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, #ff5555 0%, #cc0000 100%)', border: '10px solid #aa0000', color: 'white', fontSize: '3rem', fontWeight: '900', boxShadow: '0 15px 50px rgba(255, 0, 0, 0.6)' },
  mcButton: { width: '100%', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '1.2rem', background: 'rgba(255,255,255,0.05)' }
};

export default ControllerView;
