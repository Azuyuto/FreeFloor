import type { GameState, Player, Tile } from "./types";

export function buildGameStateFromPlayers(
  players: Record<string, Player>,
  gridSize = 4
): Pick<GameState, "players" | "tiles" | "gridSize"> {
  const playerArray = Object.values(players);
  const tiles: Record<string, Tile> = {};

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const tileId = `${row}-${col}`;
      tiles[tileId] = { id: tileId, category: "-", owner: "" };
    }
  }

  for (const player of playerArray) {
    for (const tileId of player.territory) {
      if (tiles[tileId]) {
        tiles[tileId] = {
          id: tileId,
          category: player.category,
          owner: player.id,
        };
      }
    }
  }

  const updatedPlayers: Record<string, Player> = {};
  for (const player of playerArray) {
    const ownedTiles = Object.entries(tiles)
      .filter(([, tile]) => tile.owner === player.id)
      .map(([id]) => id);

    updatedPlayers[player.id] = { ...player, territory: ownedTiles };
  }

  return { gridSize, tiles, players: updatedPlayers };
}
