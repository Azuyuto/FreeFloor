import fs from "node:fs/promises";
import path from "node:path";
import type { Player } from "./types";
import { getDataDir } from "./publicPaths";

const playersFile = () => path.join(getDataDir(), "players.json");

async function ensureDataDir() {
  await fs.mkdir(getDataDir(), { recursive: true });
}

export async function loadPlayersFromDisk(): Promise<Record<string, Player>> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(playersFile(), "utf-8");
    const parsed = JSON.parse(raw) as Record<string, Player>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export async function savePlayersToDisk(players: Record<string, Player>): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(playersFile(), JSON.stringify(players, null, 2), "utf-8");
}
