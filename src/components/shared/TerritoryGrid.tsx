"use client";

import { Checkbox } from "@/components/ui/checkbox";

type TerritoryGridProps = {
  gridSize: number;
  selectedTiles: string[];
  onToggle: (tileId: string) => void;
};

export default function TerritoryGrid({ gridSize, selectedTiles, onToggle }: TerritoryGridProps) {
  const rows = [];
  for (let row = 0; row < gridSize; row++) {
    const rowTiles = [];
    for (let col = 0; col < gridSize; col++) {
      const tileId = `${row}-${col}`;
      const isSelected = selectedTiles.includes(tileId);
      rowTiles.push(
        <div
          key={tileId}
          className={`flex aspect-square cursor-pointer items-center justify-center border-2 transition-colors ${
            isSelected ? "border-blue-500 bg-blue-100" : "border-gray-300 bg-gray-50"
          } hover:bg-blue-50`}
          onClick={() => onToggle(tileId)}
        >
          <Checkbox checked={isSelected} onChange={() => onToggle(tileId)} className="pointer-events-none" />
        </div>
      );
    }
    rows.push(
      <div key={row} className="flex gap-1">
        {rowTiles}
      </div>
    );
  }

  return <div className="flex flex-col gap-1">{rows}</div>;
}
