"use client";

import { useEffect, useState } from "react";
import { Check, Dices, Download, Grid3x3, Minus, Plus, Shuffle, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminActionTile from "./AdminActionTile";
import {
  DEFAULT_CORRECT_REVEAL_MS,
  DEFAULT_PASS_REVEAL_MS,
  DEFAULT_ROUND_DURATION_SECONDS,
  MAX_GRID_SIZE,
  MAX_REVEAL_MS,
  MAX_ROUND_DURATION_SECONDS,
  MIN_GRID_SIZE,
  MIN_REVEAL_MS,
  MIN_ROUND_DURATION_SECONDS,
  REVEAL_MS_STEP,
} from "@/lib/gameConfigConstants";

type AdminGameSettingsProps = {
  onDraw?: () => void;
  drawPending?: boolean;
};

type ConfigPatch = {
  gridSize?: number;
  roundDurationSeconds?: number;
  correctRevealMs?: number;
  passRevealMs?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function AdminGameSettings({ onDraw, drawPending }: AdminGameSettingsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(4);
  const [roundDurationSeconds, setRoundDurationSeconds] = useState(DEFAULT_ROUND_DURATION_SECONDS);
  const [correctRevealMs, setCorrectRevealMs] = useState(DEFAULT_CORRECT_REVEAL_MS);
  const [passRevealMs, setPassRevealMs] = useState(DEFAULT_PASS_REVEAL_MS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/game/config")
      .then(res => res.json())
      .then(data => {
        setGridSize(data.gridSize ?? 4);
        setRoundDurationSeconds(data.roundDurationSeconds ?? DEFAULT_ROUND_DURATION_SECONDS);
        setCorrectRevealMs(data.correctRevealMs ?? DEFAULT_CORRECT_REVEAL_MS);
        setPassRevealMs(data.passRevealMs ?? DEFAULT_PASS_REVEAL_MS);
      })
      .catch(() => {
        setGridSize(4);
        setRoundDurationSeconds(DEFAULT_ROUND_DURATION_SECONDS);
        setCorrectRevealMs(DEFAULT_CORRECT_REVEAL_MS);
        setPassRevealMs(DEFAULT_PASS_REVEAL_MS);
      });
  }, []);

  const runAction = async (key: string, url: string, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setLoading(key);
    try {
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Operacja nie powiodła się");
      }
    } finally {
      setLoading(null);
    }
  };

  const saveConfig = async (patch: ConfigPatch) => {
    const next = {
      gridSize:
        patch.gridSize !== undefined
          ? clamp(patch.gridSize, MIN_GRID_SIZE, MAX_GRID_SIZE)
          : gridSize,
      roundDurationSeconds:
        patch.roundDurationSeconds !== undefined
          ? clamp(patch.roundDurationSeconds, MIN_ROUND_DURATION_SECONDS, MAX_ROUND_DURATION_SECONDS)
          : roundDurationSeconds,
      correctRevealMs:
        patch.correctRevealMs !== undefined
          ? clamp(patch.correctRevealMs, MIN_REVEAL_MS, MAX_REVEAL_MS)
          : correctRevealMs,
      passRevealMs:
        patch.passRevealMs !== undefined
          ? clamp(patch.passRevealMs, MIN_REVEAL_MS, MAX_REVEAL_MS)
          : passRevealMs,
    };

    setGridSize(next.gridSize);
    setRoundDurationSeconds(next.roundDurationSeconds);
    setCorrectRevealMs(next.correctRevealMs);
    setPassRevealMs(next.passRevealMs);
    setSaving(true);

    try {
      const res = await fetch("/api/admin/game/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Nie udało się zapisać ustawień");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <AdminActionTile
          icon={Grid3x3}
          label="Plansza"
          colorClass="bg-red-100 hover:bg-red-200 text-red-900"
          loading={loading === "board"}
          disabled={loading !== null}
          onClick={() =>
            runAction("board", "/api/admin/game/shuffle-board", "Wymieszać planszę?")
          }
        />
        <AdminActionTile
          icon={Shuffle}
          label="Kategorie"
          colorClass="bg-purple-100 hover:bg-purple-200 text-purple-900"
          loading={loading === "categories"}
          disabled={loading !== null}
          onClick={() => runAction("categories", "/api/admin/game/shuffle-categories")}
        />
        <AdminActionTile
          icon={Download}
          label="Domyślni"
          colorClass="bg-blue-100 hover:bg-blue-200 text-blue-900"
          loading={loading === "defaults"}
          disabled={loading !== null}
          onClick={() =>
            runAction("defaults", "/api/admin/game/load-defaults", "Załadować domyślnych graczy?")
          }
        />
        <AdminActionTile
          icon={Dices}
          label="Losuj"
          colorClass="bg-amber-100 hover:bg-amber-200 text-amber-900"
          loading={drawPending}
          disabled={loading !== null}
          onClick={() => onDraw?.()}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">Rozmiar planszy</span>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={saving || gridSize <= MIN_GRID_SIZE}
            onClick={() => saveConfig({ gridSize: gridSize - 1 })}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center text-sm font-bold">{gridSize}×{gridSize}</span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={saving || gridSize >= MAX_GRID_SIZE}
            onClick={() => saveConfig({ gridSize: gridSize + 1 })}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          Czas rundy
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={saving || roundDurationSeconds <= MIN_ROUND_DURATION_SECONDS}
            onClick={() => saveConfig({ roundDurationSeconds: roundDurationSeconds - 5 })}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-sm font-bold">{roundDurationSeconds}s</span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={saving || roundDurationSeconds >= MAX_ROUND_DURATION_SECONDS}
            onClick={() => saveConfig({ roundDurationSeconds: roundDurationSeconds + 5 })}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Check className="h-3.5 w-3.5" />
          Po zgadnięciu
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={saving || correctRevealMs <= MIN_REVEAL_MS}
            onClick={() => saveConfig({ correctRevealMs: correctRevealMs - REVEAL_MS_STEP })}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-14 text-center text-sm font-bold">{correctRevealMs}ms</span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={saving || correctRevealMs >= MAX_REVEAL_MS}
            onClick={() => saveConfig({ correctRevealMs: correctRevealMs + REVEAL_MS_STEP })}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <X className="h-3.5 w-3.5" />
          Czas pass
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={saving || passRevealMs <= MIN_REVEAL_MS}
            onClick={() => saveConfig({ passRevealMs: passRevealMs - REVEAL_MS_STEP })}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-14 text-center text-sm font-bold">{passRevealMs}ms</span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={saving || passRevealMs >= MAX_REVEAL_MS}
            onClick={() => saveConfig({ passRevealMs: passRevealMs + REVEAL_MS_STEP })}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
