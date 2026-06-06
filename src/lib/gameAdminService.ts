import { assignCategoriesToPlayers } from "./categoryAssigner";
import { shuffleBoard } from "./boardGenerator";
import { buildDefaultPlayersFromAvatars } from "./defaultPlayers";
import { loadAvatars, loadCategoryNames } from "./fileUtils";
import { loadPlayersFromDisk, savePlayersToDisk } from "./playersPersistence";
import type { Player } from "./types";
import { getPastelColorByIndex } from "./playerColors";
import { loadGameConfig } from "./gameConfig";

export async function shuffleBoardForPlayers(): Promise<Record<string, Player>> {
  const { gridSize } = await loadGameConfig();
  const players = await loadPlayersFromDisk();
  const playerIds = Object.keys(players);
  if (playerIds.length === 0) throw new Error("Brak graczy");

  const tiles = shuffleBoard({ gridSize, players, minTilesPerPlayer: 1 });

  for (const playerId of playerIds) {
    players[playerId].territory = Object.entries(tiles)
      .filter(([, tile]) => tile.owner === playerId)
      .map(([id]) => id);
  }

  await savePlayersToDisk(players);
  return players;
}

export async function shuffleCategoriesForPlayers(): Promise<Record<string, Player>> {
  const players = await loadPlayersFromDisk();
  const categories = await loadCategoryNames();
  if (Object.keys(players).length === 0) throw new Error("Brak graczy");
  if (categories.length === 0) throw new Error("Brak kategorii");

  const assignments = assignCategoriesToPlayers(players, categories);
  for (const [playerId, category] of Object.entries(assignments)) {
    if (players[playerId]) players[playerId].category = category;
  }

  await savePlayersToDisk(players);
  return players;
}

export async function loadDefaultPlayers(): Promise<Record<string, Player>> {
  const avatars = await loadAvatars();
  if (avatars.length === 0) throw new Error("Brak avatarów w folderze /public/avatars");

  const players = buildDefaultPlayersFromAvatars(avatars);
  const withColors = Object.fromEntries(
    Object.entries(players).map(([id, player], index) => [
      id,
      { ...player, color: player.color || getPastelColorByIndex(index) },
    ])
  );

  await savePlayersToDisk(withColors);
  return withColors;
}
