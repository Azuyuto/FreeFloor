"use client";

import { useMemo } from "react";
import { useGameContext } from "./GameProvider";
import { CategoryTile } from "./CategoryTile";
import { useCombatantStore } from "@/stores/useCombatantStore";
import { getTileHighlight } from "@/lib/boardUtils";

export default function Board() {
  const {
    state: { gridSize, tiles, duel },
  } = useGameContext();
  const selectedAttackerId = useCombatantStore(s => s.attackerId);
  const selectedDefenderId = useCombatantStore(s => s.defenderId);

  const activeAttackerId = duel?.attackerId || selectedAttackerId || null;
  const activeDefenderId = duel?.defenderId || selectedDefenderId || null;

  const highlights = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getTileHighlight>>();
    if (!activeAttackerId) return map;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const tileId = `${row}-${col}`;
        const tile = tiles[tileId];
        map.set(
          tileId,
          getTileHighlight(
            tileId,
            tile,
            tiles,
            activeAttackerId,
            activeDefenderId,
            gridSize
          )
        );
      }
    }
    return map;
  }, [tiles, activeAttackerId, activeDefenderId, gridSize]);

  return (
    <div
      className="grid gap-1 rounded-lg"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, minmax(0, ${100 / gridSize - 1}vh))`,
      }}
    >
      {[...Array(gridSize)].flatMap((_, row) =>
        [...Array(gridSize)].map((_, col) => {
          const tileId = `${row}-${col}`;
          const tile = tiles[tileId];
          return (
            <CategoryTile
              key={tileId}
              tile={tile}
              highlight={highlights.get(tileId) ?? "none"}
            />
          );
        })
      )}
    </div>
  );
}
