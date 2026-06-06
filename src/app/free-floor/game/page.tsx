"use client";

import { GameProvider } from "@/components/GameProvider";
import Board from "@/components/Board";
import DuelDialog from "@/components/DuelDialog";
import { loadInitialState } from "@/lib/loadInitialState";
import SidebarSettings from "@/components/SidebarSettings";
import AdminActionListener from "@/components/AdminActionListener";
import PlayersSyncListener from "@/components/PlayersSyncListener";
import { usePlayersStore } from "@/stores/usePlayersStore";
import { useGameConfigStore } from "@/stores/useGameConfigStore";
import AttackerDrawListener from "@/components/AttackerDrawListener";
import StartDuelListener from "@/components/StartDuelListener";
import CancelDuelListener from "@/components/CancelDuelListener";
import GameSyncPublisher from "@/components/GameSyncPublisher";
import { useEffect, useState } from "react";

export default function GamePage() {
  const [ready, setReady] = useState(false);
  const { hydrated, loadFromServer } = usePlayersStore();
  const loadConfig = useGameConfigStore(s => s.loadFromServer);

  useEffect(() => {
    Promise.all([loadFromServer(), loadConfig()]).finally(() => setReady(true));
  }, [loadFromServer, loadConfig]);

  if (!ready || !hydrated) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-4">
        <p className="text-muted-foreground">Ładowanie gry...</p>
      </main>
    );
  }

  const gameState = loadInitialState();
  return (
    <GameProvider initial={gameState}>
      <main className="grid h-dvh grid-cols-[minmax(300px,1fr)_2fr] gap-4 p-4">
        <SidebarSettings />
        <div className="flex items-center justify-center overflow-auto">
          <Board />
        </div>
        <AdminActionListener />
        <PlayersSyncListener />
        <AttackerDrawListener />
        <StartDuelListener />
        <CancelDuelListener />
        <GameSyncPublisher />
        <DuelDialog />
      </main>
    </GameProvider>
  );
}