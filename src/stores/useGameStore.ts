// src/stores/useGameStore.ts
import { create } from "zustand";

const CURRENT_IMAGE_STORAGE_KEY = "freefloor.currentImage";

const getStoredCurrentImage = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CURRENT_IMAGE_STORAGE_KEY);
};

type GameStore = {
  currentImage: string | null;
  setCurrentImage: (img: string | null) => void;
  syncCurrentImageFromStorage: () => void;
  // ...inne stany jak duel, tiles itd.
};

export const useGameStore = create<GameStore>(set => ({
  currentImage: getStoredCurrentImage(),
  setCurrentImage: img => {
    if (typeof window !== "undefined") {
      if (img) {
        window.localStorage.setItem(CURRENT_IMAGE_STORAGE_KEY, img);
      } else {
        window.localStorage.removeItem(CURRENT_IMAGE_STORAGE_KEY);
      }
    }

    set(state => (state.currentImage === img ? state : { currentImage: img }));
  },
  syncCurrentImageFromStorage: () => {
    set({ currentImage: getStoredCurrentImage() });
  },
}));
