"use client";

import { useEffect, useRef } from "react";
import { useGameContext } from "@/components/GameProvider";
import { useGameStore } from "@/stores/useGameStore";

export default function CancelDuelListener() {
  const { state, dispatch } = useGameContext();
  const duelActiveRef = useRef(false);
  const lastCancelDuelTokenRef = useRef(0);

  duelActiveRef.current = !!state.duel;

  useEffect(() => {
    const syncCancelToken = async () => {
      try {
        const res = await fetch("/api/sync");
        const data = await res.json();
        const token = data.cancelDuelToken ?? 0;

        if (token > lastCancelDuelTokenRef.current) {
          lastCancelDuelTokenRef.current = token;
          if (duelActiveRef.current) {
            useGameStore.getState().setCurrentImage(null);
            dispatch(g => g.cancelDuel());
          }
        }
      } catch {
        // ignore polling errors
      }
    };

    void syncCancelToken();
    const intervalId = window.setInterval(syncCancelToken, 200);
    return () => window.clearInterval(intervalId);
  }, [dispatch]);

  return null;
}
