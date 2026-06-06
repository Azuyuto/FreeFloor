// components/GameProvider.tsx
"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { GameState } from "@/lib/types";
import { GameEngine } from "@/lib/gameEngine";
import { usePlayersStore } from "@/stores/usePlayersStore";

const GameCtx = createContext<ReturnType<typeof useGame> | null>(null);
export const useGameContext = () => useContext(GameCtx)!;

function useGame(initial: GameState) {
  const [snap, setSnap] = useState(initial);
  const engineRef = useRef(new GameEngine(initial));
  const { players } = usePlayersStore(); // ← pobierz

  const dispatch = <T,>(fn: (g: GameEngine) => T): T => {
    const result = fn(engineRef.current);
    setSnap(engineRef.current.snapshot);
    return result;
  };

  
  useEffect(() => {
    dispatch(engine => {
      engine.setPlayers(players); // dodaj setPlayers w GameEngine
    });
  }, [players]);

  return { state: snap, dispatch };
}

export const GameProvider = ({
  initial,
  children,
}: {
  initial: GameState;
  children: React.ReactNode;
}) => (
  <GameCtx.Provider value={useGame(initial)}>{children}</GameCtx.Provider>
);