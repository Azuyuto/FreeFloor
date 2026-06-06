"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import CombatantColumn from "@/components/shared/CombatantColumn";
import { useSyncCombatants } from "@/hooks/useSyncCombatants";
import { useCombatantStore } from "@/stores/useCombatantStore";
import type { Player } from "@/lib/types";

export default function AdminCombatants() {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [starting, setStarting] = useState(false);
  const attacker = useCombatantStore(s => s.attackerId);
  const defender = useCombatantStore(s => s.defenderId);
  const setAttacker = useCombatantStore(s => s.setAttackerId);
  const setDefender = useCombatantStore(s => s.setDefenderId);

  useSyncCombatants(attacker, defender, setAttacker, setDefender);

  const loadPlayers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/players");
      setPlayers(await res.json());
    } catch {
      setPlayers({});
    }
  }, []);

  useEffect(() => {
    loadPlayers();
    const intervalId = window.setInterval(loadPlayers, 3000);
    return () => window.clearInterval(intervalId);
  }, [loadPlayers]);

  const canStart = !!attacker && !!defender && attacker !== defender;

  const startDuel = async () => {
    if (!canStart) return;
    setStarting(true);
    try {
      const res = await fetch("/api/admin/game/start-duel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attackerId: attacker, defenderId: defender }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Nie udało się rozpocząć pojedynku");
      }
    } finally {
      setStarting(false);
    }
  };

  if (Object.keys(players).length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Dodaj graczy w zakładce „Gracze”, aby wybrać atakującego i obrońcę.
      </p>
    );
  }

  return (
    <section className="space-y-2 border-t pt-3">
      <h3 className="text-xs font-semibold text-foreground">Atakujący i obrońca</h3>
      <p className="text-[11px] text-muted-foreground">
        Wybór synchronizuje się z ekranem gry (jak w panelu bocznym /game).
      </p>
      <div className="grid grid-cols-2 gap-2">
        <CombatantColumn
          title="Atakujący"
          playerId={attacker}
          players={players}
          onSelect={setAttacker}
          excludeId={defender}
          accentClass="border-orange-200 bg-orange-50/50"
        />
        <CombatantColumn
          title="Obrońca"
          playerId={defender}
          players={players}
          onSelect={setDefender}
          excludeId={attacker}
          accentClass="border-blue-200 bg-blue-50/50"
        />
      </div>

      <Button
        className="w-full"
        onClick={startDuel}
        disabled={!canStart || starting}
      >
        {starting ? "Uruchamianie…" : "Rozpocznij pojedynek"}
      </Button>
    </section>
  );
}
