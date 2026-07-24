import { create } from "zustand";
import {
  DEFAULT_CORRECT_REVEAL_MS,
  DEFAULT_GRID_SIZE,
  DEFAULT_PASS_REVEAL_MS,
  DEFAULT_ROUND_DURATION_SECONDS,
} from "@/lib/gameConfigConstants";

type GameConfigStore = {
  gridSize: number;
  roundDurationSeconds: number;
  correctRevealMs: number;
  passRevealMs: number;
  setGridSize: (size: number) => void;
  setRoundDurationSeconds: (seconds: number) => void;
  setCorrectRevealMs: (ms: number) => void;
  setPassRevealMs: (ms: number) => void;
  loadFromServer: () => Promise<void>;
};

export const useGameConfigStore = create<GameConfigStore>((set) => ({
  gridSize: DEFAULT_GRID_SIZE,
  roundDurationSeconds: DEFAULT_ROUND_DURATION_SECONDS,
  correctRevealMs: DEFAULT_CORRECT_REVEAL_MS,
  passRevealMs: DEFAULT_PASS_REVEAL_MS,
  setGridSize: size => set({ gridSize: size }),
  setRoundDurationSeconds: seconds => set({ roundDurationSeconds: seconds }),
  setCorrectRevealMs: ms => set({ correctRevealMs: ms }),
  setPassRevealMs: ms => set({ passRevealMs: ms }),
  loadFromServer: async () => {
    const res = await fetch("/api/admin/game/config");
    const data = await res.json();
    set({
      gridSize: data.gridSize ?? DEFAULT_GRID_SIZE,
      roundDurationSeconds: data.roundDurationSeconds ?? DEFAULT_ROUND_DURATION_SECONDS,
      correctRevealMs: data.correctRevealMs ?? DEFAULT_CORRECT_REVEAL_MS,
      passRevealMs: data.passRevealMs ?? DEFAULT_PASS_REVEAL_MS,
    });
  },
}));
