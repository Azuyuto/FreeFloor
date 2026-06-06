import fs from "node:fs/promises";
import path from "node:path";
import { getDataDir } from "./publicPaths";

import { DEFAULT_GRID_SIZE, MAX_GRID_SIZE, MIN_GRID_SIZE } from "./gameConfigConstants";

const CONFIG_FILE = () => path.join(getDataDir(), "config.json");

export type GameConfig = {
  gridSize: number;
};

async function ensureDataDir() {
  await fs.mkdir(getDataDir(), { recursive: true });
}

export async function loadGameConfig(): Promise<GameConfig> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(CONFIG_FILE(), "utf-8");
    const parsed = JSON.parse(raw) as GameConfig;
    const size = Number(parsed.gridSize);
    if (size >= MIN_GRID_SIZE && size <= MAX_GRID_SIZE) {
      return { gridSize: size };
    }
  } catch {
    // use default
  }
  return { gridSize: DEFAULT_GRID_SIZE };
}

export async function saveGameConfig(config: GameConfig): Promise<GameConfig> {
  const size = Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, Math.round(config.gridSize)));
  await ensureDataDir();
  const next = { gridSize: size };
  await fs.writeFile(CONFIG_FILE(), JSON.stringify(next, null, 2), "utf-8");
  return next;
}

