// src/components/CategoryTile.tsx
import { Avatar, AvatarImage } from "./ui/avatar";
import { useGameContext } from "./GameProvider";
import { Tile } from "@/lib/types";
import type { TileHighlight } from "@/lib/boardUtils";
import { getPastelColorFromId } from "@/lib/playerColors";
import { formatDisplayLabel } from "@/lib/imageUtils";

export function CategoryTile({
  tile,
  highlight,
}: {
  tile: Tile;
  highlight: TileHighlight;
}) {
  const { state } = useGameContext();
  const owner = tile.owner ? state.players[tile.owner] : null;

  const baseBg = owner ? owner.color || getPastelColorFromId(owner.id) : undefined;

  return (
    <div
      className={`
        relative aspect-square flex items-center justify-center
        border-2 cursor-pointer transition-all duration-200 overflow-hidden
        ${highlight === "attacker" ? "border-4 border-red-600 z-10" : ""}
        ${highlight === "defender" ? "border-4 border-gray-500 z-[5]" : ""}
        ${highlight === "neighbor" ? "border-2 border-white/80 z-[3]" : ""}
        ${highlight === "none" && !owner ? "bg-muted/40 opacity-50" : ""}
      `}
      style={
        highlight === "attacker"
          ? { backgroundColor: "#fca5a5" }
          : highlight === "none" && owner
            ? { backgroundColor: baseBg }
            : highlight !== "dimmed" && owner
              ? { backgroundColor: baseBg }
              : undefined
      }
      data-owner={owner?.id || "empty"}
    >
      {owner ? (
        <>
          <span className="absolute bottom-1 left-1 z-10 rounded bg-gray-800/90 px-1 text-[12px] text-white">
            {owner.nickname}
          </span>
          <Avatar className="h-33 w-33">
            <AvatarImage
              src={owner.avatarUrl}
              alt={owner.nickname}
              className="size-[calc(100%+1rem)] max-w-none -m-2 object-cover"
            />
          </Avatar>
          <span className="absolute bottom-1 right-1 z-10 rounded bg-gray-800/90 px-1 text-[12px] text-white">
            {formatDisplayLabel(tile.category)}
          </span>
        </>
      ) : (
        <span className="text-gray-400 text-sm">Puste</span>
      )}

      {highlight === "dimmed" && (
        <div className="absolute inset-0 z-20 bg-gray-900/55 backdrop-grayscale pointer-events-none" />
      )}
    </div>
  );
}
