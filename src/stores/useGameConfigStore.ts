import { create } from "zustand";

type GameConfigStore = {
  gridSize: number;
  setGridSize: (size: number) => void;
  loadFromServer: () => Promise<void>;
};

export const useGameConfigStore = create<GameConfigStore>((set) => ({
  gridSize: 4,
  setGridSize: size => set({ gridSize: size }),
  loadFromServer: async () => {
    const res = await fetch("/api/admin/game/config");
    const data = await res.json();
    set({ gridSize: data.gridSize ?? 4 });
  },
}));
