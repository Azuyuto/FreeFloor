"use client";

import { useCallback, useEffect, useRef } from "react";

export function useSyncCombatants(
  attacker: string,
  defender: string,
  setAttacker: (id: string) => void,
  setDefender: (id: string) => void
) {
  const skipPushRef = useRef(true);

  const pushToServer = useCallback(async (nextAttacker: string, nextDefender: string) => {
    await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedAttackerId: nextAttacker || null,
        selectedDefenderId: nextDefender || null,
      }),
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/sync");
        const data = await res.json();
        setAttacker(data.selectedAttackerId ?? "");
        setDefender(data.selectedDefenderId ?? "");
      } catch {
        // ignore
      } finally {
        skipPushRef.current = false;
      }
    };
    load();
  }, [setAttacker, setDefender]);

  useEffect(() => {
    if (skipPushRef.current) return;
    void pushToServer(attacker, defender);
  }, [attacker, defender, pushToServer]);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/sync");
        const data = await res.json();
        const nextAttacker = data.selectedAttackerId ?? "";
        const nextDefender = data.selectedDefenderId ?? "";
        if (nextAttacker !== attacker) {
          skipPushRef.current = true;
          setAttacker(nextAttacker);
          skipPushRef.current = false;
        }
        if (nextDefender !== defender) {
          skipPushRef.current = true;
          setDefender(nextDefender);
          skipPushRef.current = false;
        }
      } catch {
        // ignore
      }
    };

    const intervalId = window.setInterval(poll, 800);
    return () => window.clearInterval(intervalId);
  }, [attacker, defender, setAttacker, setDefender]);
}
