// src/lib/loadInitialState.ts
import type { GameState } from "./types";
import { usePlayersStore } from "@/stores/usePlayersStore";
import { useGameConfigStore } from "@/stores/useGameConfigStore";
import { buildGameStateFromPlayers } from "./buildGameState";

export function loadInitialState(): GameState {
  const { players } = usePlayersStore.getState();
  const { gridSize } = useGameConfigStore.getState();
  const board = buildGameStateFromPlayers(players, gridSize);

  return {
    id: "main",
    ...board,
    status: "waiting",
    duel: undefined,
    locked: false,
  };
}
