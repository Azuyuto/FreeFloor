import fs from "node:fs/promises";
import path from "node:path";
import { getDataDir } from "./publicPaths";

import {
  DEFAULT_CORRECT_REVEAL_MS,
  DEFAULT_GRID_SIZE,
  DEFAULT_PASS_REVEAL_MS,
  DEFAULT_ROUND_DURATION_SECONDS,
  MAX_GRID_SIZE,
  MAX_REVEAL_MS,
  MAX_ROUND_DURATION_SECONDS,
  MIN_GRID_SIZE,
  MIN_REVEAL_MS,
  MIN_ROUND_DURATION_SECONDS,
} from "./gameConfigConstants";

const CONFIG_FILE = () => path.join(getDataDir(), "config.json");

export type GameConfig = {
  gridSize: number;
  roundDurationSeconds: number;
  correctRevealMs: number;
  passRevealMs: number;
};

async function ensureDataDir() {
  await fs.mkdir(getDataDir(), { recursive: true });
}

function clampGridSize(size: number) {
  return Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, Math.round(size)));
}

function clampRoundDuration(seconds: number) {
  return Math.min(
    MAX_ROUND_DURATION_SECONDS,
    Math.max(MIN_ROUND_DURATION_SECONDS, Math.round(seconds))
  );
}

function clampRevealMs(ms: number) {
  return Math.min(MAX_REVEAL_MS, Math.max(MIN_REVEAL_MS, Math.round(ms)));
}

function normalizeRevealMs(value: unknown, fallback: number) {
  const ms = Number(value);
  return ms >= MIN_REVEAL_MS && ms <= MAX_REVEAL_MS ? ms : fallback;
}

function normalizeConfig(raw: Partial<GameConfig> | null | undefined): GameConfig {
  const size = Number(raw?.gridSize);
  const duration = Number(raw?.roundDurationSeconds);
  return {
    gridSize:
      size >= MIN_GRID_SIZE && size <= MAX_GRID_SIZE ? size : DEFAULT_GRID_SIZE,
    roundDurationSeconds:
      duration >= MIN_ROUND_DURATION_SECONDS && duration <= MAX_ROUND_DURATION_SECONDS
        ? duration
        : DEFAULT_ROUND_DURATION_SECONDS,
    correctRevealMs: normalizeRevealMs(raw?.correctRevealMs, DEFAULT_CORRECT_REVEAL_MS),
    passRevealMs: normalizeRevealMs(raw?.passRevealMs, DEFAULT_PASS_REVEAL_MS),
  };
}

export async function loadGameConfig(): Promise<GameConfig> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(CONFIG_FILE(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<GameConfig>;
    return normalizeConfig(parsed);
  } catch {
    // use default
  }
  return normalizeConfig(null);
}

export async function saveGameConfig(config: Partial<GameConfig>): Promise<GameConfig> {
  const current = await loadGameConfig();
  const next: GameConfig = {
    gridSize:
      config.gridSize !== undefined ? clampGridSize(config.gridSize) : current.gridSize,
    roundDurationSeconds:
      config.roundDurationSeconds !== undefined
        ? clampRoundDuration(config.roundDurationSeconds)
        : current.roundDurationSeconds,
    correctRevealMs:
      config.correctRevealMs !== undefined
        ? clampRevealMs(config.correctRevealMs)
        : current.correctRevealMs,
    passRevealMs:
      config.passRevealMs !== undefined
        ? clampRevealMs(config.passRevealMs)
        : current.passRevealMs,
  };
  await ensureDataDir();
  await fs.writeFile(CONFIG_FILE(), JSON.stringify(next, null, 2), "utf-8");
  return next;
}
