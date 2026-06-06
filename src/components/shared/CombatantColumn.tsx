"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Player } from "@/lib/types";
import { formatDisplayLabel } from "@/lib/imageUtils";

type CombatantColumnProps = {
  title: string;
  playerId: string;
  players: Record<string, Player>;
  onSelect: (id: string) => void;
  excludeId?: string;
  accentClass: string;
};

export default function CombatantColumn({
  title,
  playerId,
  players,
  onSelect,
  excludeId,
  accentClass,
}: CombatantColumnProps) {
  const selected = playerId ? players[playerId] : null;
  const options = Object.values(players).filter(p => p.id !== excludeId);

  return (
    <div className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 ${accentClass}`}>
      <h5 className="text-xs font-bold uppercase tracking-wide">{title}</h5>

      {selected ? (
        <div className="flex flex-col items-center gap-1">
          <img
            src={selected.avatarUrl}
            alt={selected.nickname}
            className="h-16 w-16 rounded-full border-2 border-white object-cover shadow"
          />
          <span className="text-sm font-bold">{selected.nickname}</span>
          <span className="text-[10px] text-muted-foreground">
            {formatDisplayLabel(selected.category)}
          </span>
        </div>
      ) : (
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-dashed text-xs text-muted-foreground">
          Brak
        </div>
      )}

      <Select
        value={playerId || "__none__"}
        onValueChange={v => onSelect(v === "__none__" ? "" : v)}
      >
        <SelectTrigger className="w-full text-xs">
          <SelectValue placeholder={`Wybierz ${title.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— Brak —</SelectItem>
          {options.map(p => (
            <SelectItem key={p.id} value={p.id}>
              <div className="flex items-center gap-2">
                <img src={p.avatarUrl} alt={p.nickname} className="h-5 w-5 rounded-full object-cover" />
                {p.nickname}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
