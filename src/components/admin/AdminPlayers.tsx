"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TerritoryGrid from "@/components/shared/TerritoryGrid";
import type { Player } from "@/lib/types";
import { PASTEL_PLAYER_COLORS, getPastelColorByIndex, getPastelColorFromId } from "@/lib/playerColors";

export default function AdminPlayers() {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [avatars, setAvatars] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [category, setCategory] = useState("");
  const [playerColor, setPlayerColor] = useState<string>(PASTEL_PLAYER_COLORS[0]);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [gridSize, setGridSize] = useState(4);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [playersRes, avatarsRes, categoriesRes, configRes] = await Promise.all([
      fetch("/api/admin/players"),
      fetch("/api/admin/avatars"),
      fetch("/api/category-names"),
      fetch("/api/admin/game/config"),
    ]);
    setPlayers(await playersRes.json());
    setAvatars(await avatarsRes.json());
    setCategories(await categoriesRes.json());
    const config = await configRes.json();
    if (typeof config.gridSize === "number") {
      setGridSize(config.gridSize);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveAllPlayers = async (nextPlayers: Record<string, Player>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/players", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: nextPlayers }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Błąd zapisu");
        return false;
      }
      setPlayers(nextPlayers);
      return true;
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    setEditId(null);
    setNickname("");
    setAvatarUrl(avatars[0] ?? "");
    setCategory(categories[0] ?? "");
    setPlayerColor(getPastelColorByIndex(Object.keys(players).length));
    setSelectedTiles([]);
  };

  const openEdit = (id: string) => {
    const p = players[id];
    setEditId(id);
    setNickname(p.nickname);
    setAvatarUrl(p.avatarUrl);
    setCategory(p.category);
    setPlayerColor(p.color || getPastelColorFromId(p.id));
    setSelectedTiles(p.territory ?? []);
  };

  const toggleTile = (tileId: string) => {
    setSelectedTiles(prev =>
      prev.includes(tileId) ? prev.filter(id => id !== tileId) : [...prev, tileId]
    );
  };

  const savePlayer = async () => {
    const next = { ...players };
    if (editId) {
      next[editId] = {
        ...next[editId],
        nickname,
        avatarUrl,
        category,
        color: playerColor,
        territory: selectedTiles,
      };
    } else {
      const id = crypto.randomUUID();
      next[id] = {
        id,
        nickname: nickname || "Gracz",
        avatarUrl: avatarUrl || avatars[0] || "",
        category: category || categories[0] || "",
        color: playerColor,
        territory: selectedTiles,
        timeLeft: 45_000,
        lockedUntil: 0,
      };
    }
    const ok = await saveAllPlayers(next);
    if (ok) {
      setEditId(null);
      setNickname("");
    }
  };

  const removePlayer = async (id: string) => {
    if (!confirm("Usunąć gracza?")) return;
    const next = { ...players };
    delete next[id];
    await saveAllPlayers(next);
    if (editId === id) setEditId(null);
  };

  const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/avatars", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error ?? "Błąd uploadu avatara");
      return;
    }
    const data = await res.json();
    await loadData();
    setAvatarUrl(data.url);
  };

  const deleteAvatarFile = async (url: string) => {
    const filename = url.split("/").pop();
    if (!filename || !confirm(`Usunąć avatar ${filename}?`)) return;
    await fetch("/api/admin/avatars", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    await loadData();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-4 space-y-4">
        <h2 className="text-lg font-semibold">Avatary</h2>
        <p className="text-sm text-muted-foreground">
          Zdjęcia profilowe przechowywane w <code>public/avatars/</code>.
        </p>
        <div className="flex flex-wrap gap-3">
          {avatars.map(url => (
            <div key={url} className="relative group">
              <img src={url} alt="" className="h-16 w-16 rounded-full object-cover border" />
              <button
                type="button"
                className="absolute -top-1 -right-1 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs"
                onClick={() => deleteAvatarFile(url)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <Label htmlFor="avatar-upload">Dodaj nowy avatar</Label>
        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) uploadAvatar(file);
            e.target.value = "";
          }}
        />
      </section>

      <section className="rounded-lg border bg-card p-4 space-y-4">
        <h2 className="text-lg font-semibold">
          {editId ? "Edytuj gracza" : "Nowy gracz"}
        </h2>

        <div className="space-y-2">
          <Label>Nick</Label>
          <Input value={nickname} onChange={e => setNickname(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Avatar</Label>
          <Select value={avatarUrl} onValueChange={setAvatarUrl}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz avatar" />
            </SelectTrigger>
            <SelectContent>
              {avatars.map(url => (
                <SelectItem key={url} value={url}>
                  <div className="flex items-center gap-2">
                    <img src={url} alt="" className="h-6 w-6 rounded-full object-cover" />
                    {url.split("/").pop()}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Kategoria</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
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

        <div className="space-y-2">
          <Label>Kolor</Label>
          <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
            {PASTEL_PLAYER_COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={`h-8 w-8 rounded-full border-2 ${
                  playerColor === color ? "border-black" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setPlayerColor(color)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Posiadane pola na planszy</Label>
          <div className="rounded border p-3">
            <TerritoryGrid
              gridSize={gridSize}
              selectedTiles={selectedTiles}
              onToggle={toggleTile}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Zaznacz pola ({selectedTiles.length} wybranych)
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={savePlayer} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {editId ? "Zapisz zmiany" : "Dodaj gracza"}
          </Button>
          {editId && (
            <Button variant="secondary" onClick={openAdd}>
              Anuluj
            </Button>
          )}
          {!editId && (
            <Button variant="outline" onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Nowy formularz
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 space-y-4">
        <h2 className="text-lg font-semibold">Lista graczy</h2>
        {Object.keys(players).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Brak zapisanych graczy. Dodaj graczy tutaj — gra wczyta ich przy starcie.
          </p>
        ) : (
          <ul className="space-y-2">
            {Object.values(players).map(p => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <img src={p.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <div className="font-medium">{p.nickname}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.category} · {p.territory?.length ?? 0} pola
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(p.id)}>
                    Edytuj
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => removePlayer(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
