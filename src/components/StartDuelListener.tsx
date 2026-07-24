"use client";

import { useEffect, useRef } from "react";
import { useGameContext } from "@/components/GameProvider";
import { useGameConfigStore } from "@/stores/useGameConfigStore";

let lastStartDuelToken = 0;

export default function StartDuelListener() {
  const { state, dispatch } = useGameContext();
  const duelActiveRef = useRef(false);

  duelActiveRef.current = !!state.duel || state.status === "finished";

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/sync");
        const data = await res.json();
        lastStartDuelToken = data.startDuelToken ?? 0;
      } catch {
        lastStartDuelToken = 0;
      }
    };
    void init();

    const poll = async () => {
      if (duelActiveRef.current) return;

      try {
        const res = await fetch("/api/sync");
        const data = await res.json();
        if (
          data.startDuelToken > lastStartDuelToken &&
          data.pendingStartDuel?.attackerId &&
          data.pendingStartDuel?.defenderId
        ) {
          lastStartDuelToken = data.startDuelToken;
          const { attackerId, defenderId } = data.pendingStartDuel;

          // Konsumuj od razu, żeby po końcu rundy pending nie odpalił jej ponownie.
          await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ consumeStartDuel: true }),
          }).catch(() => undefined);

          const duration = useGameConfigStore.getState().roundDurationSeconds;
          dispatch(g => g.startDuel(attackerId, defenderId, duration));
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
