export type Category = {
  id: string;          // 'animals'
  name: string;        // 'Zwierzęta'
  images: string[];    // ścieżki mediów kategorii (obrazy lub audio)
};

export type Player = {
  id: string;
  nickname: string;
  avatarUrl: string;
  color: string;      // kolor gracza (np. #FADADD)
  territory: string[]; // list of tile ids
  category: string;    // id kategorii
  timeLeft: number;    // ms, start 45000
  lockedUntil: number; // timestamp, 0 = brak blokady
};

export type Tile = {
  id: string;          // '3-4'
  category: string;
  owner: string;       // player.id
};

export type GameState = {
  id: string;
  gridSize: number;    // np. 10
  tiles: Record<string, Tile>;
  players: Record<string, Player>;
  status: "waiting" | "duel" | "loading" | "finished";
  duel?: DuelState;
  lastWinner?: string;
  lastWinnerWasDefender?: boolean;
  locked: boolean;
};

export type DuelState = {
  attackerId: string;
  defenderId: string;
  category: string;    // defender’s category
  currentTurn: string; // id gracza, którego czas leci
  startedAt: number;
  imageIndex: number;
  imageQueue: string[];
};