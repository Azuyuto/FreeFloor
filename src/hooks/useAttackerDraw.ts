"use client";

import { useCallback, useRef, useState } from "react";
import type { Player } from "@/lib/types";

type UseAttackerDrawOptions = {
  players: Record<string, Player>;
  onSelect: (playerId: string) => void;
};

export function useAttackerDraw({ players, onSelect }: UseAttackerDrawOptions) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const clearDrawInterval = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startDraw = useCallback(() => {
    const playerIds = Object.keys(players);
    if (playerIds.length === 0 || isDrawing) return;

    clearDrawInterval();
    setIsDrawing(true);
    setShowModal(true);
    let tick = 0;
    const totalTicks = 28;

    intervalRef.current = window.setInterval(() => {
      const previewIndex = Math.floor(Math.random() * playerIds.length);
      setPreviewId(playerIds[previewIndex]);
      tick += 1;

      if (tick >= totalTicks) {
        clearDrawInterval();
        const finalIndex = Math.floor(Math.random() * playerIds.length);
        const winnerId = playerIds[finalIndex];
        setPreviewId(winnerId);
        onSelect(winnerId);

        window.setTimeout(() => {
          setIsDrawing(false);
          setShowModal(false);
          setPreviewId(null);
        }, 900);
      }
    }, 85);
  }, [isDrawing, onSelect, players]);

  const previewPlayer = previewId ? players[previewId] ?? null : null;

  return {
    isDrawing,
    showModal,
    previewPlayer,
    startDraw,
  };
}
