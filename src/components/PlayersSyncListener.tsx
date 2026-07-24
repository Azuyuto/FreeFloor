"use client";

import { useEffect, useRef } from "react";
import { usePlayersStore } from "@/stores/usePlayersStore";
import { useGameConfigStore } from "@/stores/useGameConfigStore";
import { useGameContext } from "@/components/GameProvider";

let lastPlayersUpdatedAt = 0;
let lastConfigUpdatedAt = 0;

export default function PlayersSyncListener() {
  const loadFromServer = usePlayersStore(s => s.loadFromServer);
  const loadConfig = useGameConfigStore(s => s.loadFromServer);
  const { state, dispatch } = useGameContext();
  const statusRef = useRef(state.status);

  statusRef.current = state.status;

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/sync");
        const data = await res.json();
        lastPlayersUpdatedAt = data.playersUpdatedAt ?? 0;
        lastConfigUpdatedAt = data.configUpdatedAt ?? 0;
      } catch {
        lastPlayersUpdatedAt = 0;
        lastConfigUpdatedAt = 0;
      }
    };
    void init();

    const poll = async () => {
      try {
        const res = await fetch("/api/sync");
        const data = await res.json();
        let needsReload = false;

        if (data.configUpdatedAt > lastConfigUpdatedAt) {
          lastConfigUpdatedAt = data.configUpdatedAt;
          await loadConfig();
          // Rozmiar planszy — tylko poza aktywną rundą
          if (statusRef.current === "waiting") {
            needsReload = true;
          }
        }

        if (data.playersUpdatedAt > lastPlayersUpdatedAt) {
          lastPlayersUpdatedAt = data.playersUpdatedAt;
          await loadFromServer();
          // Po endDuel zapis graczy nie może wywołać reloadFromStore
          // (czyścił finished i powodował dziwne „zapętlenie” kolejnej rundy).
          if (statusRef.current === "waiting") {
            needsReload = true;
          }
        }

        if (needsReload) {
          const gridSize = useGameConfigStore.getState().gridSize;
          dispatch(g => g.reloadFromStore(gridSize));
        }
      } catch {
        // ignore
      }
    };

    const intervalId = window.setInterval(poll, 2000);
    return () => window.clearInterval(intervalId);
  }, [loadFromServer, loadConfig, dispatch]);

  return null;
}
