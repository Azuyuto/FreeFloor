"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDisplayLabel, getImageNameFromPath } from "@/lib/imageUtils";
import type { DuelSyncInfo } from "@/lib/serverSync";
import { useSyncPoll } from "@/hooks/useSyncPoll";
import MediaPreview from "./MediaPreview";
import AdminGameSettings from "./AdminGameSettings";
import AdminCombatants from "./AdminCombatants";

type SyncSnapshot = {
  currentImage: string | null;
  nextImage: string | null;
  afterNextImage: string | null;
  syncGeneration: number;
  pendingAction: string | null;
  duelInfo: DuelSyncInfo | null;
  playersUpdatedAt: number;
  cancelDuelToken: number;
  categoriesRevision: number;
  updatedAt: number;
};

export default function AdminControls() {
  const [actionPending, setActionPending] = useState(false);
  const [drawPending, setDrawPending] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);
  const sendActionRef = useRef<(action: "correct" | "wrong") => void>(() => {});
  const canControlRef = useRef(false);
  const lastCategoriesRevisionRef = useRef(0);

  const fetchSync = useCallback(async () => {
    const res = await fetch(`/api/sync?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("sync failed");
    return (await res.json()) as SyncSnapshot;
  }, []);

  const { data: sync, refresh } = useSyncPoll(fetchSync, { intervalMs: 100 });

  const sendAction = useCallback(async (action: "correct" | "wrong") => {
    if (!canControlRef.current) return;
    setActionPending(true);
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) return;
      await refresh();
    } finally {
      setActionPending(false);
    }
  }, [refresh]);

  const requestDraw = async () => {
    setDrawPending(true);
    try {
      await fetch("/api/admin/game/draw-attacker", { method: "POST" });
      await refresh();
    } finally {
      setDrawPending(false);
    }
  };

  const cancelDuel = async () => {
    if (!canControlRef.current) return;
    if (!confirm("Anulować trwający pojedynek?")) return;
    setCancelPending(true);
    try {
      const res = await fetch("/api/admin/game/cancel-duel", { method: "POST" });
      if (!res.ok) return;
      await res.json();
      await refresh();
    } finally {
      setCancelPending(false);
    }
  };

  sendActionRef.current = sendAction;

  useEffect(() => {
    const revision = sync?.categoriesRevision ?? 0;
    if (revision > lastCategoriesRevisionRef.current) {
      lastCategoriesRevisionRef.current = revision;
    }
  }, [sync?.categoriesRevision]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        sendActionRef.current("wrong");
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        sendActionRef.current("correct");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const duel = sync?.duelInfo ?? null;
  const currentImage = duel ? (sync?.currentImage ?? null) : null;
  const nextImage = duel ? (sync?.nextImage ?? null) : null;
  const afterNextImage = duel ? (sync?.afterNextImage ?? null) : null;
  const currentImageName = getImageNameFromPath(currentImage);
  const canControl = !!duel;

  canControlRef.current = canControl;

  return (
    <div className="flex flex-col gap-3 overflow-y-auto text-sm">
      <AdminGameSettings onDraw={requestDraw} drawPending={drawPending} />

      <AdminCombatants />

      {duel ? (
        <div className="rounded-lg border bg-card p-3 text-xs">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{duel.attackerNickname}</span>
            {" vs "}
            <span className="font-medium text-foreground">{duel.defenderNickname}</span>
          </p>
          <p className="mt-1 text-muted-foreground">
            Tura: <strong className="text-foreground">{duel.currentTurnNickname}</strong>
          </p>
          <p className="mt-2 text-lg font-bold leading-tight text-foreground">
            {formatDisplayLabel(duel.category)}
          </p>
          {duel.status !== "duel" && (
            <p className="mt-1 text-muted-foreground">
              Status: <strong className="text-foreground">{duel.status}</strong>
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Brak aktywnego pojedynku</p>
      )}

      <div className="flex justify-center gap-1.5 sm:gap-3">
        <MediaPreview src={currentImage} label="Teraz" size="admin" />
        <MediaPreview src={nextImage} label="Następne" size="admin" />
        <MediaPreview src={afterNextImage} label="Za 2" size="admin" />
      </div>

      <p className="rounded border bg-background px-3 py-2.5 text-center text-base font-semibold leading-tight">
        {currentImageName}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          className="h-10 bg-green-600 text-sm font-semibold hover:bg-green-700"
          onClick={() => sendAction("correct")}
          disabled={actionPending || !canControl}
        >
          ✓ Poprawna
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="h-10 text-sm font-semibold"
          onClick={() => sendAction("wrong")}
          disabled={actionPending || !canControl}
        >
          ✗ Pas
        </Button>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="h-10 w-full text-sm font-semibold"
        onClick={cancelDuel}
        disabled={cancelPending || !canControl}
      >
        {cancelPending ? "Anulowanie…" : "Anuluj pojedynek"}
      </Button>

      {!canControl && (
        <p className="text-center text-[11px] text-amber-600">
          Przyciski aktywne, gdy na ekranie gry trwa pojedynek
        </p>
      )}

      <section className="space-y-1.5 border-t pt-2 text-xs text-muted-foreground">
        <h3 className="font-semibold text-foreground">Instrukcja</h3>
        <ul className="list-disc space-y-1 pl-4 leading-snug">
          <li>
            <strong className="text-foreground">Gra</strong> — ekran planszy na projektorze.
          </li>
          <li>
            <strong className="text-foreground">Admin</strong> — sterowanie z tabletu (klawiatura działa).
          </li>
          <li>
            <kbd className="rounded border px-1">A–Z</kbd> = poprawna (2 s, zmiana tury).
          </li>
          <li>
            <kbd className="rounded border px-1">Spacja</kbd> = pas (czas leci dalej, bez zmiany tury).
          </li>
          <li>Losowanie atakującego wyświetla się na ekranie gry.</li>
          <li>
            <kbd className="rounded border px-1">Esc</kbd> w grze lub przycisk powyżej = anulowanie pojedynku.
          </li>
        </ul>
      </section>
    </div>
  );
}
