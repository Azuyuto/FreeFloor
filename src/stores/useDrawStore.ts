import { create } from "zustand";

type DrawStore = {
  localDrawToken: number;
  triggerLocalDraw: () => void;
};

export const useDrawStore = create<DrawStore>(set => ({
  localDrawToken: 0,
  triggerLocalDraw: () => set({ localDrawToken: Date.now() }),
}));
