import { useState, useEffect } from 'react';
import { supabase } from '../supabaseJS';

export const useGameLogic = (roomCode = 'default') => {
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState({});

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', roomCode)
        .maybeSingle(); // Verhindert 406 Fehler bei 0 Ergebnissen

      if (error) {
        console.error("Supabase Error:", error);
        return;
      }

      if (data) {
        setSession(data);
        setPlayers(data.players || {});
      } else {
        // Erstelle initiale Session falls nicht vorhanden
        console.log("Erstelle neue Session...");
        await supabase.from('game_sessions').insert([{ id: roomCode }]);
      }
    };

    fetchSession();

    const channel = supabase.channel(`game_${roomCode}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'game_sessions',
        filter: `id=eq.${roomCode}`
      }, (payload) => {
        setSession(payload.new);
        setPlayers(payload.new.players || {});
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  // Aktionen (Analog zu Socket-Events)
  const updateSession = async (updates) => {
    await supabase
      .from('game_sessions')
      .update(updates)
      .eq('id', roomCode);
  };

  const joinGame = async (player) => {
    const newPlayers = { ...players, [player.id]: player };
    await updateSession({ players: newPlayers });
  };

  const voteCategory = async (playerId, category) => {
    const newPlayers = { ...players };
    if (newPlayers[playerId]) {
      newPlayers[playerId].vote = category;
      const newVotes = { ...session.category_votes };
      newVotes[category] = (newVotes[category] || 0) + 1;
      
      const allVoted = Object.values(newPlayers).every(p => p.vote);
      if (allVoted) {
        // Gewinner ermitteln
        let winner = category;
        let maxVotes = 0;
        for (const [cat, v] of Object.entries(newVotes)) {
          if (v > maxVotes) { maxVotes = v; winner = cat; }
        }
        
        // Songs laden (Zukunftsblick: Hier müssten wir aus Supabase laden)
        // Für den Moment simulieren wir den Phasenwechsel
        await updateSession({ 
          players: newPlayers, 
          category_votes: newVotes, 
          selected_category: winner,
          phase: 'readyCheck' 
        });
      } else {
        await updateSession({ players: newPlayers, category_votes: newVotes });
      }
    }
  };

  const submitBuzzer = async (playerId) => {
    if (session.phase === 'playing' && !session.rater_id) {
      // Erzeuge MC Optionen (Das sollte eigentlich der Host machen, aber hier als Hook-Aktion)
      await updateSession({ 
        rater_id: playerId, 
        phase: 'hotseat',
        mc_correct: null,
        wrong_answer: null
      });
      return true;
    }
    return false;
  };

  const submitMC = async (playerId, answer, isCorrect) => {
    if (session.phase === 'hotseat' && session.rater_id === playerId) {
      const newPlayers = { ...players };
      if (isCorrect) newPlayers[playerId].score += 100;
      
      await updateSession({ 
        players: newPlayers,
        mc_correct: isCorrect,
        wrong_answer: isCorrect ? null : answer,
        phase: 'results'
      });
    }
  };

  const readyNextSong = async (playerId) => {
    const newPlayers = { ...players };
    if (newPlayers[playerId]) {
      newPlayers[playerId].nextSongReady = true;
      const allReady = Object.values(newPlayers).every(p => p.nextSongReady);
      
      if (allReady) {
        // Reset für nächste Runde
        Object.keys(newPlayers).forEach(id => newPlayers[id].nextSongReady = false);
        
        if (session.current_song_index < session.songs.length - 1) {
          await updateSession({
            players: newPlayers,
            current_song_index: session.current_song_index + 1,
            phase: 'readyCheck',
            rater_id: null
          });
        } else {
          await updateSession({
            players: newPlayers,
            phase: 'ranking'
          });
        }
      } else {
        await updateSession({ players: newPlayers });
      }
    }
  };

  return { session, players, updateSession, joinGame, voteCategory, submitBuzzer, submitMC, readyNextSong };
};
