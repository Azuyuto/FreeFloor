"use client";

import { useEffect, useRef } from "react";
import { useGameContext } from "@/components/GameProvider";
import { adminActionHandlers } from "@/lib/adminActionBridge";

export default function AdminActionListener() {
  const { state } = useGameContext();
  const duelActiveRef = useRef(false);

  duelActiveRef.current = !!state.duel;

  useEffect(() => {
    const pollAdminActions = async () => {
      if (!duelActiveRef.current) return;

      try {
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consumeAction: true, duelActive: true }),
        });
        const data = await res.json();
        if (data.consumedAction === "correct") {
          adminActionHandlers.onCorrect?.();
        }
        if (data.consumedAction === "wrong") {
          adminActionHandlers.onWrong?.();
        }
      } catch {
        // ignore polling errors
      }
    };

    void pollAdminActions();
    const intervalId = window.setInterval(pollAdminActions, 200);
    return () => window.clearInterval(intervalId);
  }, []);

  return null;
}
