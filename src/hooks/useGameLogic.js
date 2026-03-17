import { useState, useEffect } from 'react';
import { supabase } from '../supabaseJS';

export const useGameLogic = (roomCode = 'default') => {
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState({});

  useEffect(() => {
    // 1. Initialer Fetch des Session-Status
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', roomCode)
        .single();

      if (data) {
        setSession(data);
        setPlayers(data.players || {});
      }
    };

    fetchSession();

    // 2. Realtime Listener für Änderungen
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

  // Funktionen für die Steuerung
  const updatePhase = async (newPhase) => {
    await supabase
      .from('game_sessions')
      .update({ phase: newPhase })
      .eq('id', roomCode);
  };

  const joinGame = async (player) => {
    const newPlayers = { ...players, [player.id]: player };
    await supabase
      .from('game_sessions')
      .update({ players: newPlayers })
      .eq('id', roomCode);
  };

  const submitBuzzer = async (playerId) => {
    if (session.phase === 'playing' && !session.rater_id) {
      await supabase
        .from('game_sessions')
        .update({ rater_id: playerId, phase: 'buzzed' })
        .eq('id', roomCode);
      return true;
    }
    return false;
  };

  return { session, players, updatePhase, joinGame, submitBuzzer };
};
