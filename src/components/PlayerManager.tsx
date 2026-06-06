// src/components/PlayerManager.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Save, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import CombatantColumn from "@/components/shared/CombatantColumn";
import TerritoryGrid from "@/components/shared/TerritoryGrid";
import { usePlayersStore } from "@/stores/usePlayersStore";
import { useCombatantStore } from "@/stores/useCombatantStore";
import { useGameContext } from "./GameProvider";
import { PASTEL_PLAYER_COLORS, getPastelColorByIndex, getPastelColorFromId } from "@/lib/playerColors";
import { useSyncCombatants } from "@/hooks/useSyncCombatants";
import { useDrawStore } from "@/stores/useDrawStore";
import { useGameConfigStore } from "@/stores/useGameConfigStore";

export default function PlayerManager() {
  const {
    players,
    setAvailableCategories,
    addPlayer,
    updatePlayer,
    removePlayer,
    saveToServer,
  } = usePlayersStore();
  const { state, dispatch } = useGameContext();
  const appliedWinnerRef = useRef<string | null>(null);
  const attacker = useCombatantStore(s => s.attackerId);
  const defender = useCombatantStore(s => s.defenderId);
  const setAttacker = useCombatantStore(s => s.setAttackerId);
  const setDefender = useCombatantStore(s => s.setDefenderId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [category, setCategory] = useState("");
  const [playerColor, setPlayerColor] = useState<string>(getPastelColorByIndex(0));
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);

  const [avatars, setAvatars] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const gridSize = useGameConfigStore(s => s.gridSize);

  useSyncCombatants(attacker, defender, setAttacker, setDefender);

  useEffect(() => {
    if (state.status !== "finished" || !state.lastWinner) {
      appliedWinnerRef.current = null;
      return;
    }

    if (appliedWinnerRef.current === state.lastWinner) return;
    appliedWinnerRef.current = state.lastWinner;

    if (state.lastWinnerWasDefender) {
      setAttacker(state.lastWinner);
      if (defender === state.lastWinner || !players[defender]) {
        setDefender("");
      }
    } else if (defender && !players[defender]) {
      setDefender("");
    }
  }, [
    state.status,
    state.lastWinner,
    state.lastWinnerWasDefender,
    players,
    defender,
    setAttacker,
    setDefender,
  ]);

  const triggerLocalDraw = useDrawStore(s => s.triggerLocalDraw);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [avatarsRes, categoriesRes] = await Promise.all([
          fetch("/api/avatars"),
          fetch("/api/category-names"),
        ]);
        const avatarsData = await avatarsRes.json();
        const categoriesData = await categoriesRes.json();
        setAvatars(avatarsData);
        setCategories(categoriesData);
        setAvailableCategories(categoriesData);
      } catch (error) {
        console.error("Błąd wczytywania danych:", error);
      }
    };
    fetchData();
  }, [setAvailableCategories]);

  const openAdd = () => {
    setEditId(null);
    setNickname("");
    setAvatarUrl(avatars[0] || "");
    setCategory(categories[0] || "");
    setPlayerColor(getPastelColorByIndex(Object.keys(players).length));
    setSelectedTiles([]);
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const p = players[id];
    setEditId(id);
    setNickname(p.nickname);
    setAvatarUrl(p.avatarUrl);
    setCategory(p.category);
    setPlayerColor(p.color || getPastelColorFromId(p.id));
    setSelectedTiles(p.territory || []);
    setDialogOpen(true);
  };

  const savePlayer = async () => {
    if (editId) {
      updatePlayer(editId, {
        nickname,
        avatarUrl,
        category,
        color: playerColor,
        territory: selectedTiles,
      });
    } else {
      addPlayer({ nickname, avatarUrl, category, color: playerColor, territory: selectedTiles });
    }
    await saveToServer();
    setDialogOpen(false);
    dispatch(g => g.reloadFromStore());
  };

  const startDuel = () => {
    if (attacker && defender && attacker !== defender) {
      dispatch(g => g.startDuel(attacker, defender));
    }
  };

  const toggleTile = (tileId: string) => {
    setSelectedTiles(prev =>
      prev.includes(tileId) ? prev.filter(id => id !== tileId) : [...prev, tileId]
    );
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 space-y-3 px-4 py-4">
          <h4 className="font-medium">Rozpocznij pojedynek</h4>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={triggerLocalDraw}
            disabled={Object.keys(players).length === 0}
          >
            Losuj atakującego 🎲
          </Button>

          <div className="grid grid-cols-2 gap-3">
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

          <Button className="w-full" onClick={startDuel} disabled={!attacker || !defender}>
            Rozpocznij!
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <h4 className="mb-2 shrink-0 text-left font-medium">Lista graczy</h4>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {Object.values(players).map(p => (
              <div key={p.id} className="flex items-center justify-between rounded border p-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full border"
                    style={{ backgroundColor: p.color || getPastelColorFromId(p.id) }}
                  />
                  <img src={p.avatarUrl} alt={p.nickname} className="h-8 w-8 rounded-full object-cover" />
                  <div className="text-left">
                    <div>{p.nickname} ({p.category})</div>
                    <div className="text-xs text-gray-500">{p.territory.length} pola</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="secondary" onClick={() => openEdit(p.id)}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={async () => {
                      removePlayer(p.id);
                      await saveToServer();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-3 w-full shrink-0 bg-green-500 hover:bg-green-600" onClick={openAdd}>
            Dodaj nowego gracza +
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editId ? "Edytuj gracza" : "Nowy gracz"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nick">Nick</Label>
              <Input id="nick" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full" />
            </div>

            <div>
              <Label htmlFor="avatar">Avatar</Label>
              <Select value={avatarUrl} onValueChange={setAvatarUrl}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Wybierz avatar" />
                </SelectTrigger>
                <SelectContent>
                  {avatars.map(avatar => (
                    <SelectItem key={avatar} value={avatar}>
                      <div className="flex items-center gap-2">
                        <img src={avatar} alt="Avatar" className="h-8 w-8 rounded-full object-cover" />
                        {decodeURIComponent(avatar.split("/").pop() ?? "")}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Kategoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="player-color">Kolor gracza</Label>
              <div className="mt-2 flex items-center gap-3">
                <Input
                  id="player-color"
                  type="color"
                  value={playerColor}
                  onChange={e => setPlayerColor(e.target.value)}
                  className="h-10 w-14 p-1"
                />
                <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                  {PASTEL_PLAYER_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Ustaw kolor ${color}`}
                      className={`h-6 w-6 shrink-0 rounded-full border-2 ${
                        playerColor === color ? "border-black" : "border-white"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setPlayerColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>Posiadane pola na planszy</Label>
              <div className="mt-2 rounded border p-3">
                <TerritoryGrid
                  gridSize={gridSize}
                  selectedTiles={selectedTiles}
                  onToggle={toggleTile}
                />
                <div className="mt-2 text-sm text-gray-600">
                  Zaznacz pola ({selectedTiles.length} wybranych)
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={savePlayer} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              {editId ? "Zapisz" : "Dodaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
