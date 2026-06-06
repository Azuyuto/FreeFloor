"use client";

import { useEffect, useState } from "react";
import { Dices, Download, Grid3x3, Minus, Plus, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminActionTile from "./AdminActionTile";
import { MAX_GRID_SIZE, MIN_GRID_SIZE } from "@/lib/gameConfigConstants";

type AdminGameSettingsProps = {
  onDraw?: () => void;
  drawPending?: boolean;
};

export default function AdminGameSettings({ onDraw, drawPending }: AdminGameSettingsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(4);
  const [savingSize, setSavingSize] = useState(false);

  useEffect(() => {
    fetch("/api/admin/game/config")
      .then(res => res.json())
      .then(data => setGridSize(data.gridSize ?? 4))
      .catch(() => setGridSize(4));
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

  const saveGridSize = async (next: number) => {
    const clamped = Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, next));
    setGridSize(clamped);
    setSavingSize(true);
    try {
      const res = await fetch("/api/admin/game/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gridSize: clamped }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Nie udało się zapisać rozmiaru planszy");
      }
    } finally {
      setSavingSize(false);
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
            disabled={savingSize || gridSize <= MIN_GRID_SIZE}
            onClick={() => saveGridSize(gridSize - 1)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center text-sm font-bold">{gridSize}×{gridSize}</span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={savingSize || gridSize >= MAX_GRID_SIZE}
            onClick={() => saveGridSize(gridSize + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
