"use client";

import { useEffect, useRef } from "react";
import { useGameContext } from "@/components/GameProvider";
import { useGameStore } from "@/stores/useGameStore";

let lastCancelDuelToken = 0;

export default function CancelDuelListener() {
  const { state, dispatch } = useGameContext();
  const duelActiveRef = useRef(false);

  duelActiveRef.current = !!state.duel;

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/sync");
        const data = await res.json();
        lastCancelDuelToken = data.cancelDuelToken ?? 0;
      } catch {
        lastCancelDuelToken = 0;
      }
    };
    void init();

    const poll = async () => {
      if (!duelActiveRef.current) return;

      try {
        const res = await fetch("/api/sync");
        const data = await res.json();
        if (data.cancelDuelToken > lastCancelDuelToken) {
          lastCancelDuelToken = data.cancelDuelToken;
          useGameStore.getState().setCurrentImage(null);
          dispatch(g => g.cancelDuel());
        }
      } catch {
        // ignore
      }
    };

    const intervalId = window.setInterval(poll, 400);
    return () => window.clearInterval(intervalId);
  }, [dispatch]);

  return null;
}
