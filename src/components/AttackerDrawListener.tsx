"use client";

import { useEffect, useRef } from "react";
import { usePlayersStore } from "@/stores/usePlayersStore";
import { useCombatantStore } from "@/stores/useCombatantStore";
import { useDrawStore } from "@/stores/useDrawStore";
import { useAttackerDraw } from "@/hooks/useAttackerDraw";
import AttackerDrawModal from "./AttackerDrawModal";

let lastServerDrawToken = 0;

export default function AttackerDrawListener() {
  const players = usePlayersStore(s => s.players);
  const setAttacker = useCombatantStore(s => s.setAttackerId);
  const localDrawToken = useDrawStore(s => s.localDrawToken);
  const lastLocalTokenRef = useRef(0);
  const startDrawRef = useRef<() => void>(() => {});

  const { isDrawing, showModal, previewPlayer, startDraw } = useAttackerDraw({
    players,
    onSelect: setAttacker,
  });

  startDrawRef.current = startDraw;

  useEffect(() => {
    if (localDrawToken > lastLocalTokenRef.current) {
      lastLocalTokenRef.current = localDrawToken;
      startDrawRef.current();
    }
  }, [localDrawToken]);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/sync");
        const data = await res.json();
        lastServerDrawToken = data.drawAttackerToken ?? 0;
      } catch {
        lastServerDrawToken = 0;
      }
    };
    void init();

    const poll = async () => {
      try {
        const res = await fetch("/api/sync");
        const data = await res.json();
        if (data.drawAttackerToken > lastServerDrawToken) {
          lastServerDrawToken = data.drawAttackerToken;
          startDrawRef.current();
        }
      } catch {
        // ignore
      }
    };

    const intervalId = window.setInterval(poll, 400);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <AttackerDrawModal open={showModal} player={previewPlayer} isDrawing={isDrawing} />
  );
}
