// src/stores/usePlayersStore.ts
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Player } from "@/lib/types";
import { assignCategoriesToPlayers } from "@/lib/categoryAssigner";
import { getPastelColorByIndex, getPastelColorFromId } from "@/lib/playerColors";

type NewPlayerInput = Omit<Player, "id" | "timeLeft" | "lockedUntil" | "color"> & {
  color?: string;
};

type PlayersState = {
  players: Record<string, Player>;
  availableCategories: string[];
  hydrated: boolean;
  setAvailableCategories: (categories: string[]) => void;
  shuffleCategories: () => void;
  setPlayers: (newPlayers: Record<string, Player>) => void;
  addPlayer: (p: NewPlayerInput) => void;
  updatePlayer: (id: string, patch: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  loadFromServer: () => Promise<void>;
  saveToServer: () => Promise<void>;
};

const persistPlayers = async (players: Record<string, Player>) => {
  if (typeof window === "undefined") return;
  await fetch("/api/admin/players", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ players }),
  });
};

export const usePlayersStore = create<PlayersState>()(
  immer((set, get) => ({
    players: {},
    availableCategories: [],
    hydrated: false,
    setAvailableCategories: (categories) =>
      set(draft => {
        draft.availableCategories = categories;
      }),
    shuffleCategories: () =>
      set(draft => {
        const { players, availableCategories } = get();
        
        if (availableCategories.length === 0) {
          console.warn("Brak dostępnych kategorii do przypisania");
          return;
        }

        const assignments = assignCategoriesToPlayers(players, availableCategories);
        
        // Przypisz nowe kategorie graczom
        Object.entries(assignments).forEach(([playerId, category]) => {
          if (draft.players[playerId]) {
            draft.players[playerId].category = category;
          }
        });
      }),
    setPlayers: (newPlayers) =>
      set(draft => {
        const playersWithColors = Object.fromEntries(
          Object.entries(newPlayers).map(([id, player], index) => [
            id,
            {
              ...player,
              color: player.color || getPastelColorByIndex(index) || getPastelColorFromId(id),
            },
          ]),
        );

        draft.players = playersWithColors;
      }),

    addPlayer: p =>
      set(draft => {
        const id = crypto.randomUUID();
        draft.players[id] = {
          ...p,
          id,
          color: p.color || getPastelColorByIndex(Object.keys(draft.players).length),
          timeLeft: 45_000,
          lockedUntil: 0,
        };
      }),

    updatePlayer: (id, patch) =>
      set(draft => {
        if (draft.players[id]) {
          Object.assign(draft.players[id], patch);
          if (patch.territory) {
            draft.players[id].territory = patch.territory;
          }
        }
      }),

    removePlayer: id =>
      set(draft => {
        delete draft.players[id];
      }),

    loadFromServer: async () => {
      const res = await fetch("/api/admin/players");
      const data = await res.json();
      set(draft => {
        draft.players = data ?? {};
        draft.hydrated = true;
      });
    },

    saveToServer: async () => {
      const { players } = get();
      await persistPlayers(players);
    },
  })),
);
