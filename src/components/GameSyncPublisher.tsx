"use client";

import { useEffect, useRef } from "react";
import { useGameContext } from "@/components/GameProvider";
import { useGameStore } from "@/stores/useGameStore";
import type { GameState } from "@/lib/types";
import type { DuelSyncInfo } from "@/lib/serverSync";

export type GameSyncPayload = {
  currentImage: string | null;
  nextImage: string | null;
  duelInfo: DuelSyncInfo | null;
};

export function buildGameSyncPayload(state: GameState): GameSyncPayload {
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
  const currentImage =
    queue.length > 0 ? (queue[idx] ?? null) : useGameStore.getState().currentImage;
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

function payloadsEqual(a: GameSyncPayload, b: GameSyncPayload) {
  return (
    a.currentImage === b.currentImage &&
    a.nextImage === b.nextImage &&
    a.duelInfo?.imageIndex === b.duelInfo?.imageIndex &&
    a.duelInfo?.status === b.duelInfo?.status &&
    a.duelInfo?.currentTurnNickname === b.duelInfo?.currentTurnNickname &&
    a.duelInfo?.attackerNickname === b.duelInfo?.attackerNickname &&
    a.duelInfo?.defenderNickname === b.duelInfo?.defenderNickname &&
    (a.duelInfo === null) === (b.duelInfo === null)
  );
}

export default function GameSyncPublisher() {
  const { state } = useGameContext();
  const stateRef = useRef(state);
  const latestPayloadRef = useRef<GameSyncPayload | null>(null);
  const lastSentRef = useRef<GameSyncPayload | null>(null);
  const inFlightRef = useRef(false);

  stateRef.current = state;

  const flush = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      while (latestPayloadRef.current) {
        const payload = latestPayloadRef.current;
        latestPayloadRef.current = null;

        if (lastSentRef.current && payloadsEqual(lastSentRef.current, payload)) {
          continue;
        }

        await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source: "game", ...payload }),
          keepalive: true,
        });
        lastSentRef.current = payload;
      }
    } catch {
      // Kolejna zmiana stanu spróbuje ponownie.
    } finally {
      inFlightRef.current = false;
      if (latestPayloadRef.current) {
        void flush();
      }
    }
  };

  const publish = (payload: GameSyncPayload) => {
    latestPayloadRef.current = payload;
    void flush();
  };

  useEffect(() => {
    publish(buildGameSyncPayload(state));
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
    return useGameStore.subscribe(() => {
      publish(buildGameSyncPayload(stateRef.current));
    });
  }, []);

  return null;
}
