// src/components/ChessTimer.tsx
"use client";

import { useGameContext } from "./GameProvider";
import { useEffect, useRef } from "react";

interface ChessTimerProps {
  playerId: string;
  /** Tylko jeden timer w pojedynku powinien tykać — inaczej podwójne endDuel. */
  ticks?: boolean;
}

export function ChessTimer({ playerId, ticks = false }: ChessTimerProps) {
  const { state, dispatch } = useGameContext();
  const duel = state.duel;
  const endingRef = useRef(false);

  useEffect(() => {
    endingRef.current = false;
  }, [duel?.attackerId, duel?.defenderId]);

  useEffect(() => {
    if (!ticks || !duel || state.status !== "duel") return;

    const id = window.setInterval(() => {
      const loser = dispatch(g => g.tick());
      if (loser && !endingRef.current) {
        endingRef.current = true;
        dispatch(g => g.endDuel());
      }
    }, 100);

    return () => window.clearInterval(id);
  }, [ticks, duel?.attackerId, duel?.defenderId, state.status, dispatch]);

  if (!duel) return null;

  const player = state.players[playerId];
  if (!player) return null;

  const displaySeconds = Math.max(player.timeLeft, 0) / 1000;
  
  return (
    <div className="gap-2 py-1">
      <h3 className="text-2xl font-bold mb-2">{player.nickname}</h3>
      <div className="text-4xl font-mono mb-2">
        {displaySeconds.toFixed(1)}s
      </div>
    </div>
  );
}
