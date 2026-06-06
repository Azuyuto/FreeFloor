// src/lib/gameEngine.ts
import { produce } from "immer";
import type { GameState, Player } from "./types";
import { shuffleBoard } from "./boardGenerator";
import { buildGameStateFromPlayers } from "./buildGameState";
import { usePlayersStore } from "@/stores/usePlayersStore";

export class GameEngine {
  private state: GameState;

  constructor(initial: GameState) {
    this.state = initial;
  }

  /** Serializuj stan (np. do wysłania przez WS) */
  get snapshot() {
    return structuredClone(this.state);
  }

  syncPlayersToStore() {
    const { setPlayers, saveToServer } = usePlayersStore.getState();
    setPlayers(structuredClone(this.state.players));
    void saveToServer();
  }
  

  /** Rozpocznij pojedynek – wywoływane przez front */
  startDuel(attackerId: string, defenderId: string) {
    const attacker = this.state.players[attackerId];
    const defender = this.state.players[defenderId];
    if (!attacker || !defender) throw new Error("Nie ma takiego gracza");

    this.setState(draft => {
      // Zresetuj timery do 45 000 ms
      draft.players[attackerId].timeLeft = 45_000;
      draft.players[defenderId].timeLeft = 45_000;

      draft.status = "loading";
      draft.locked = true;
      draft.duel = {
        attackerId,
        defenderId,
        category: defender.category,
        currentTurn: attackerId,
        startedAt: Date.now() + 5_000,
        imageIndex: 0
      };
    });
  }

  endLoading() {
    this.setState(draft => {
      draft.status = "duel";
      draft.locked = false;
    });
  }

  /** Rejestrowanie poprawnej odpowiedzi */
  answerCorrect(playerId: string) {
    this.enforceTurn(playerId);
    this.unlockTick();
    this.setState(draft => {
      if (draft.duel) {
        draft.duel.imageIndex++;
        draft.duel.currentTurn = draft.duel.currentTurn === draft.duel.attackerId 
          ? draft.duel.defenderId 
          : draft.duel.attackerId;
      }
    });
  }

  /** Pass/niepoprawna – blokada 3 s */
  answerWrong(playerId: string) {
    this.enforceTurn(playerId);
    this.setState(draft => {
      if (draft.duel) {
        draft.duel.imageIndex++;
      }
    });
  }

  logImageName(imageName: string)
  {
    console.log("Załadowano obraz:", imageName);
  }

  /** Aktualizuj timery; zwraca id przegranego lub null */
tick() {
  const duel = this.state.duel;
  if (!duel) return null;
  const now = Date.now();
  const current = this.state.players[duel.currentTurn];

  // Jeżeli jest blokada/pauza, przesuń punkt startu, ale nie odejmuj czasu
  if (current.lockedUntil > now || this.state.locked) {
    // Przesuwamy startedAt, żeby po pauzie delta była liczona od tego momentu
    this.setState(draft => {
      if (draft.duel) {
        draft.duel.startedAt = now;
      }
    });
    return null;
  }

  // Oblicz upływ czasu od ostatniego tick()
  const delta = now - duel.startedAt;

  // Mutuj stan przez setState
  this.setState(draft => {
    if (draft.duel) {
      draft.players[duel.currentTurn].timeLeft -= delta;
      draft.duel.startedAt = now;
    }
  });

  // Sprawdź czy gracz przegrał
  if (this.state.players[duel.currentTurn].timeLeft <= 0) {
    return current.id; // przegrał
  }
  return null;
}

lockTick() {
    this.setState(draft => {
      draft.locked = true;
    });
}

unlockTick() {
    this.setState(draft => {
      draft.locked = false;
    });
}

  /** Anulowanie pojedynku bez zmian na planszy (jak Esc w grze) */
  cancelDuel() {
    this.setState(draft => {
      draft.duel = undefined;
      draft.status = "waiting";
      draft.locked = false;
      draft.lastWinner = undefined;
      draft.lastWinnerWasDefender = undefined;
    });
  }

  /** Zakończenie rundy i przejęcie pola */
endDuel() {
  const duel = this.state.duel!;
  const pA = this.state.players[duel.attackerId];
  const pD = this.state.players[duel.defenderId];
  const unplayedCategory = pA.category;

  // wybierz zwycięzcę na podstawie większego pozostałego czasu
  const winnerId = (pA.timeLeft >= pD.timeLeft) ? duel.attackerId : duel.defenderId;
  const loserId  = winnerId === duel.attackerId ? duel.defenderId : duel.attackerId;

  const duelistTerritory = Object.values(this.state.tiles)
    .filter(t => t.owner === loserId)
    .map(t => t.id);

  this.setState(draft => {
    // przejmij pola
    for (const tileId of duelistTerritory) {
      draft.tiles[tileId].owner = winnerId;
    }
    // zwycięzca dostaje kategorię, która nie była grana (kategorię atakującego)
    draft.players[winnerId].category = unplayedCategory;

    // ujednolić kategorię na wszystkich polach zwycięzcy na mapie
    Object.values(draft.tiles).forEach(tile => {
      if (tile.owner === winnerId) {
        tile.category = unplayedCategory;
      }
    });

    // zaktualizuj territory
    draft.players[winnerId].territory = Object.entries(draft.tiles)
      .filter(([,tile]) => tile.owner===winnerId)
      .map(([id]) => id);
    // usuń przegranego
    delete draft.players[loserId];

    // reset statusu
    draft.status = "finished";
    draft.duel   = undefined;
    // zapisz zwycięzcę w stanie
    draft.lastWinner = winnerId;
    draft.lastWinnerWasDefender = winnerId === duel.defenderId;
  });

  // zsynchronizuj panel graczy (zustand) po zmianach w silniku
  this.syncPlayersToStore();
}

  /** Immer helper */
  setState(mutator: (draft: GameState) => void) {
    this.state = produce(this.state, mutator);
  }

  private enforceTurn(playerId: string) {
    if (this.state.duel?.currentTurn !== playerId) {
      throw new Error("Nie Twoja kolej!");
    }
  }

  setPlayers(newPlayers: Record<string, Player>) {
    this.setState(draft => {
      draft.players = newPlayers;
    });
  }

  reloadFromStore(gridSize?: number) {
    const { players } = usePlayersStore.getState();
    const size = gridSize ?? this.state.gridSize;
    const board = buildGameStateFromPlayers(players, size);
    this.setState(draft => {
      draft.gridSize = size;
      draft.players = board.players;
      draft.tiles = board.tiles;
      draft.duel = undefined;
      draft.status = "waiting";
      draft.locked = false;
      draft.lastWinner = undefined;
      draft.lastWinnerWasDefender = undefined;
    });
  }

  shuffleBoard() {
    const newTiles = shuffleBoard({
      gridSize: this.state.gridSize,
      players: this.state.players,
      minTilesPerPlayer: 1,
    });

    this.setState(draft => {
      draft.tiles = newTiles;
      
      // Zaktualizuj territory dla każdego gracza
      Object.keys(draft.players).forEach(playerId => {
        const ownedTiles = Object.entries(newTiles)
          .filter(([, tile]) => tile.owner === playerId)
          .map(([id]) => id);
        
        draft.players[playerId].territory = ownedTiles;
      });
    });
  }

  // Usuń tę metodę - logika przeniesiona do answerCorrect/answerWrong
  // private switchTurn() {
  //   const duel = this.state.duel!;
  //   duel.imageIndex++;
  //   duel.currentTurn = duel.currentTurn === duel.attackerId ? duel.defenderId : duel.attackerId;
  // }
}
