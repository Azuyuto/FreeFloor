"use client";

import { useEffect, useRef } from "react";
import { useGameContext } from "@/components/GameProvider";
import { useGameStore } from "@/stores/useGameStore";
import type { GameState } from "@/lib/types";
import type { DuelSyncInfo } from "@/lib/serverSync";

function buildDuelPayload(state: GameState): {
  currentImage: string | null;
  nextImage: string | null;
  duelInfo: DuelSyncInfo | null;
} {
  const duel = state.duel;
  if (!duel) {
    return { currentImage: null, nextImage: null, duelInfo: null };
  }

  const attacker = state.players[duel.attackerId];
  const defender = state.players[duel.defenderId];
  const currentTurn = state.players[duel.currentTurn];
  if (!attacker || !defender || !currentTurn) {
    return { currentImage: null, nextImage: null, duelInfo: null };
  }

  const queue = duel.imageQueue;
  const idx = duel.imageIndex;
  const currentImage = useGameStore.getState().currentImage ?? (queue[idx] ?? null);
  const nextImage = idx + 1 < queue.length ? queue[idx + 1] : null;

  return {
    currentImage,
    nextImage,
    duelInfo: {
      attackerNickname: attacker.nickname,
      defenderNickname: defender.nickname,
      category: defender.category,
      status: state.status,
      currentTurnNickname: currentTurn.nickname,
      imageIndex: duel.imageIndex,
      imageQueue: duel.imageQueue,
    },
  };
}

export default function GameSyncPublisher() {
  const { state } = useGameContext();
  const stateRef = useRef(state);
  const mediaRevisionRef = useRef(0);
  const syncQueueRef = useRef(Promise.resolve());

  stateRef.current = state;

  const publish = (payload: ReturnType<typeof buildDuelPayload>) => {
    const revision = ++mediaRevisionRef.current;
    syncQueueRef.current = syncQueueRef.current.then(async () => {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaRevision: revision,
          currentImage: payload.currentImage,
          nextImage: payload.nextImage,
          duelInfo: payload.duelInfo,
        }),
      });
    });
  };

  useEffect(() => {
    publish(buildDuelPayload(state));
  }, [
    state.duel,
    state.duel?.attackerId,
    state.duel?.defenderId,
    state.duel?.currentTurn,
    state.duel?.imageIndex,
    state.duel?.imageQueue,
    state.status,
    state.players,
  ]);

  useEffect(() => {
    if (!state.duel) return;

    const intervalId = window.setInterval(() => {
      if (!stateRef.current.duel) return;
      publish(buildDuelPayload(stateRef.current));
    }, 400);

    return () => window.clearInterval(intervalId);
  }, [state.duel]);

  useEffect(() => {
    const onStoreChange = () => {
      if (!stateRef.current.duel) return;
      publish(buildDuelPayload(stateRef.current));
    };

    return useGameStore.subscribe(onStoreChange);
  }, []);

  return null;
}
