import type { Tile } from "./types";

export type TileHighlight = "none" | "dimmed" | "attacker" | "defender" | "neighbor";

const DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

function getAttackerAndNeighborIds(
  tiles: Record<string, Tile>,
  attackerId: string,
  gridSize: number
) {
  const attackerTileIds = new Set<string>();
  const neighborTileIds = new Set<string>();

  for (const [tileId, tile] of Object.entries(tiles)) {
    if (tile.owner === attackerId) attackerTileIds.add(tileId);
  }

  for (const tileId of attackerTileIds) {
    const [row, col] = tileId.split("-").map(Number);
    for (const [dr, dc] of DIRECTIONS) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
      neighborTileIds.add(`${nr}-${nc}`);
    }
  }

  return { attackerTileIds, neighborTileIds };
}

export function getTileHighlight(
  tileId: string,
  tile: Tile,
  tiles: Record<string, Tile>,
  attackerId: string | null,
  defenderId: string | null,
  gridSize: number
): TileHighlight {
  if (!attackerId) return "none";

  const { attackerTileIds, neighborTileIds } = getAttackerAndNeighborIds(
    tiles,
    attackerId,
    gridSize
  );
  const visibleIds = new Set([...attackerTileIds, ...neighborTileIds]);

  if (!visibleIds.has(tileId)) return "dimmed";
  if (attackerTileIds.has(tileId)) return "attacker";
  if (defenderId && tile.owner === defenderId) return "defender";
  return "neighbor";
}

export function getAttackableTileIds(
  tiles: Record<string, Tile>,
  attackerId: string,
  gridSize: number
): Set<string> {
  const attackable = new Set<string>();
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const [tileId, tile] of Object.entries(tiles)) {
    if (tile.owner !== attackerId) continue;
    const [row, col] = tileId.split("-").map(Number);

    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;

      const neighborId = `${nr}-${nc}`;
      const neighbor = tiles[neighborId];
      if (neighbor?.owner && neighbor.owner !== attackerId) {
        attackable.add(neighborId);
      }
    }
  }

  return attackable;
}
