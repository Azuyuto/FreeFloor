// src/lib/boardGenerator.ts
import type { Player, Tile } from "./types";

export interface BoardShuffleOptions {
  gridSize: number;
  players: Record<string, Player>;
  minTilesPerPlayer?: number;
}

export function shuffleBoard(options: BoardShuffleOptions): Record<string, Tile> {
  const { gridSize, players, minTilesPerPlayer = 1 } = options;
  const playerIds = Object.keys(players);
  const totalTiles = gridSize * gridSize;
  
  if (playerIds.length === 0) {
    return generateEmptyBoard(gridSize);
  }

  // Sprawdź czy możliwe jest przydzielenie minimum pól
  if (playerIds.length * minTilesPerPlayer > totalTiles) {
    throw new Error("Za dużo graczy na planszy - niemożliwe przydzielenie minimum pól");
  }

  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    try {
      const tiles = generateConnectedRegions(gridSize, playerIds, minTilesPerPlayer);
      if (validateConnectedRegions(tiles, gridSize, playerIds)) {
        return createTileObjects(tiles, gridSize, players);
      }
    } catch {
      // Ponów próbę
    }
    attempts++;
  }

  // Fallback: użyj prostszego algorytmu
  return generateSimpleRandomBoard(gridSize, playerIds, players);
}

function generateConnectedRegions(
  gridSize: number, 
  playerIds: string[], 
  minTilesPerPlayer: number
): string[][] {
  const board: string[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(""));
  const totalTiles = gridSize * gridSize;
  
  // 1. Wygeneruj losowe punkty startowe dla każdego gracza
  const startPoints = generateStartPoints(gridSize, playerIds);
  
  // 2. Przypisz punkty startowe
  for (const [playerId, point] of startPoints) {
    board[point.row][point.col] = playerId;
  }

  // 3. Rozrastaj regiony każdego gracza
  let remainingTiles = totalTiles - playerIds.length;
  const playerTileCounts = Object.fromEntries(playerIds.map(id => [id, 1]));

  while (remainingTiles > 0) {
    let expandedAny = false;

    // Losowa kolejność graczy
    const shuffledPlayers = [...playerIds].sort(() => Math.random() - 0.5);

    for (const playerId of shuffledPlayers) {
      if (remainingTiles <= 0) break;

      // Znajdź dostępne pola sąsiadujące z aktualnym regionem gracza
      const expandablePositions = findExpandablePositions(board, playerId, gridSize);
      
      if (expandablePositions.length > 0) {
        // Losowo wybierz jedno pole do rozszerzenia
        const randomPos = expandablePositions[Math.floor(Math.random() * expandablePositions.length)];
        board[randomPos.row][randomPos.col] = playerId;
        playerTileCounts[playerId]++;
        remainingTiles--;
        expandedAny = true;
      }
    }

    // Jeśli żaden gracz nie może się rozszerzyć, przerwij
    if (!expandedAny) {
      break;
    }
  }

  // 4. Sprawdź minimum pól per gracz
  for (const playerId of playerIds) {
    if (playerTileCounts[playerId] < minTilesPerPlayer) {
      throw new Error(`Gracz ${playerId} ma za mało pól`);
    }
  }

  return board;
}

function generateStartPoints(gridSize: number, playerIds: string[]): Map<string, {row: number, col: number}> {
  const startPoints = new Map();
  const usedPositions = new Set<string>();

  for (const playerId of playerIds) {
    let attempts = 0;
    while (attempts < 50) {
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);
      const posKey = `${row}-${col}`;

      if (!usedPositions.has(posKey)) {
        startPoints.set(playerId, { row, col });
        usedPositions.add(posKey);
        break;
      }
      attempts++;
    }
  }

  return startPoints;
}

function findExpandablePositions(
  board: string[][], 
  playerId: string, 
  gridSize: number
): {row: number, col: number}[] {
  const expandable = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // góra, dół, lewo, prawo

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col] === playerId) {
        // Sprawdź sąsiadujące pola
        for (const [dRow, dCol] of directions) {
          const newRow = row + dRow;
          const newCol = col + dCol;

          if (
            newRow >= 0 && newRow < gridSize &&
            newCol >= 0 && newCol < gridSize &&
            board[newRow][newCol] === ""
          ) {
            expandable.push({ row: newRow, col: newCol });
          }
        }
      }
    }
  }

  // Usuń duplikaty
  const unique = expandable.filter((pos, index, arr) => 
    arr.findIndex(p => p.row === pos.row && p.col === pos.col) === index
  );

  return unique;
}

function validateConnectedRegions(
  board: string[][], 
  gridSize: number, 
  playerIds: string[]
): boolean {
  for (const playerId of playerIds) {
    if (!isRegionConnected(board, playerId, gridSize)) {
      return false;
    }
  }
  return true;
}

function isRegionConnected(board: string[][], playerId: string, gridSize: number): boolean {
  const playerTiles = [];
  
  // Znajdź wszystkie pola gracza
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col] === playerId) {
        playerTiles.push({ row, col });
      }
    }
  }

  if (playerTiles.length === 0) return false;
  if (playerTiles.length === 1) return true;

  // BFS do sprawdzenia połączenia
  const visited = new Set<string>();
  const queue = [playerTiles[0]];
  visited.add(`${playerTiles[0].row}-${playerTiles[0].col}`);

  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const [dRow, dCol] of directions) {
      const newRow = current.row + dRow;
      const newCol = current.col + dCol;
      const key = `${newRow}-${newCol}`;

      if (
        newRow >= 0 && newRow < gridSize &&
        newCol >= 0 && newCol < gridSize &&
        board[newRow][newCol] === playerId &&
        !visited.has(key)
      ) {
        visited.add(key);
        queue.push({ row: newRow, col: newCol });
      }
    }
  }

  return visited.size === playerTiles.length;
}

function createTileObjects(
  board: string[][], 
  gridSize: number, 
  players: Record<string, Player>
): Record<string, Tile> {
  const tiles: Record<string, Tile> = {};

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const tileId = `${row}-${col}`;
      const owner = board[row][col];
      
      tiles[tileId] = {
        id: tileId,
        category: owner && players[owner] ? players[owner].category : "-",
        owner: owner || "",
      };
    }
  }

  return tiles;
}

function generateSimpleRandomBoard(
  gridSize: number, 
  playerIds: string[], 
  players: Record<string, Player>
): Record<string, Tile> {
  const tiles: Record<string, Tile> = {};
  const totalTiles = gridSize * gridSize;
  
  // Proste przydzielenie - każdy gracz dostaje równo pól
  const tilesPerPlayer = Math.floor(totalTiles / playerIds.length);
  
  let currentTile = 0;
  for (let i = 0; i < playerIds.length; i++) {
    const playerId = playerIds[i];
    const tilesToAssign = i === playerIds.length - 1 
      ? totalTiles - currentTile  // ostatni gracz dostaje resztę
      : tilesPerPlayer;

    for (let j = 0; j < tilesToAssign; j++) {
      const row = Math.floor(currentTile / gridSize);
      const col = currentTile % gridSize;
      const tileId = `${row}-${col}`;

      tiles[tileId] = {
        id: tileId,
        category: players[playerId].category,
        owner: playerId,
      };

      currentTile++;
    }
  }

  return tiles;
}

function generateEmptyBoard(gridSize: number): Record<string, Tile> {
  const tiles: Record<string, Tile> = {};
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const tileId = `${row}-${col}`;
      tiles[tileId] = {
        id: tileId,
        category: "-",
        owner: "",
      };
    }
  }

  return tiles;
}
