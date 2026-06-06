// src/components/ChessTimer.tsx
"use client";

import { useGameContext } from "./GameProvider";
import { useEffect, useState } from "react";

interface ChessTimerProps {
  playerId: string;
}

export function ChessTimer({ playerId }: ChessTimerProps) {
  const { state, dispatch } = useGameContext();
  const duel = state.duel;
  const [, rerender] = useState(0);

  useEffect(() => {
    if (!duel) return;

    const id = setInterval(() => {
      const loser = dispatch(g => g.tick());
      if (loser) {
        dispatch(g => g.endDuel());
      }
      rerender(x => x + 1);
    }, 100);

    return () => clearInterval(id);
  }, [duel, dispatch]);

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
