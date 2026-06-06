// lib/engineStore.ts
import { GameEngine } from "./gameEngine";
import type { GameState } from "./types";

/**
 * Globalny magazyn instancji gier.
 * Klucz: gameId
 * Wartość: instancja GameEngine
 */
export const engines = new Map<string, GameEngine>();

/**
 * Tworzy i zapisuje nową instancję gry w store.
 */
export function createGame(gameId: string, initialState: GameState): GameEngine {
  const engine = new GameEngine(initialState);
  engines.set(gameId, engine);
  return engine;
}