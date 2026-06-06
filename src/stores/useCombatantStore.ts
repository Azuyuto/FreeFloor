import { create } from "zustand";

type CombatantStore = {
  attackerId: string;
  defenderId: string;
  setAttackerId: (id: string) => void;
  setDefenderId: (id: string) => void;
};

export const useCombatantStore = create<CombatantStore>(set => ({
  attackerId: "",
  defenderId: "",
  setAttackerId: id => set({ attackerId: id }),
  setDefenderId: id => set({ defenderId: id }),
}));
