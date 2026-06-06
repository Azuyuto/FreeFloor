// lib/fileUtils.ts
import fs from "node:fs/promises";
import path from "node:path";
import { Category } from "./types";
import { toPublicAvatarUrl, toPublicMediaUrl } from "./mediaPaths";
import { getPublicDir } from "./publicPaths";

const categoriesBase = () => path.join(getPublicDir(), "categories");
const avatarsBase = () => path.join(getPublicDir(), "avatars");
const MEDIA_ORDER_FILE = ".media-order.json";

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|avif|svg|bmp|ico)$/i;
const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;

export const isMusicCategory = (name: string) => name.trim().startsWith("_");

const isMediaFile = (categoryId: string, filename: string) => {
  if (isMusicCategory(categoryId)) {
    return AUDIO_EXTENSIONS.test(filename);
  }
  return IMAGE_EXTENSIONS.test(filename);
};

const sanitizeSegment = (name: string) =>
  name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "");

const sanitizeFileBaseName = (name: string) =>
  name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

export function buildSafeFilename(originalFilename: string): string {
  const ext = path.extname(originalFilename).toLowerCase();
  const base = originalFilename.slice(0, originalFilename.length - ext.length);
  const safeBase = sanitizeFileBaseName(base) || "plik";
  return `${safeBase}${ext}`;
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

function resolveCategoryDir(categoryId: string) {
  return path.join(categoriesBase(), decodeURIComponent(categoryId));
}

function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function mediaOrderPath(categoryDir: string) {
  return path.join(categoryDir, MEDIA_ORDER_FILE);
}

async function readMediaOrder(categoryDir: string): Promise<string[] | null> {
  try {
    const raw = await fs.readFile(mediaOrderPath(categoryDir), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((f): f is string => typeof f === "string") : null;
  } catch {
    return null;
  }
}

async function writeMediaOrder(categoryDir: string, filenames: string[]) {
  await fs.writeFile(mediaOrderPath(categoryDir), JSON.stringify(filenames, null, 2), "utf8");
}

function applyMediaOrder(filenames: string[], order: string[] | null): string[] {
  if (!order?.length) return filenames;
  const available = new Set(filenames);
  const ordered = order.filter(name => available.has(name));
  const missing = filenames.filter(name => !order.includes(name));
  return [...ordered, ...missing];
}

async function listCategoryMediaFilenames(categoryId: string): Promise<string[]> {
  const dirPath = resolveCategoryDir(categoryId);
  const files = await fs.readdir(dirPath);
  return files.filter(f => f !== MEDIA_ORDER_FILE && isMediaFile(categoryId, f));
}

async function listCategoryMediaUrls(categoryId: string): Promise<string[]> {
  const dirPath = resolveCategoryDir(categoryId);
  const filenames = await listCategoryMediaFilenames(categoryId);
  const order = await readMediaOrder(dirPath);
  return applyMediaOrder(filenames, order).map(f => toPublicMediaUrl(categoryId, f));
}

export async function shuffleCategoryMedia(categoryId: string): Promise<string[]> {
  const dirPath = resolveCategoryDir(categoryId);
  const filenames = await listCategoryMediaFilenames(categoryId);
  const shuffled = shuffleArray(filenames);
  await writeMediaOrder(dirPath, shuffled);
  return shuffled.map(f => toPublicMediaUrl(categoryId, f));
}

export async function loadCategories(): Promise<Category[]> {
  const base = categoriesBase();
  await ensureDir(base);
  const categoryDirs = await fs.readdir(base);
  const result: Category[] = [];

  for (const dir of categoryDirs) {
    const dirPath = path.join(base, dir);
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) continue;

    const mediaFiles = await listCategoryMediaUrls(dir);
    result.push({ id: dir, name: dir, images: mediaFiles });
  }
  return result;
}

export async function loadAvatars(): Promise<string[]> {
  try {
    const base = avatarsBase();
    await ensureDir(base);
    const files = await fs.readdir(base);
    return files
      .filter(f => IMAGE_EXTENSIONS.test(f))
      .map(f => toPublicAvatarUrl(f));
  } catch (error) {
    console.warn("Nie można wczytać avatarów:", error);
    return [];
  }
}

export async function loadCategoryNames(): Promise<string[]> {
  try {
    const base = categoriesBase();
    await ensureDir(base);
    const dirs = await fs.readdir(base);
    const names: string[] = [];
    for (const dir of dirs) {
      const stat = await fs.stat(path.join(base, dir));
      if (stat.isDirectory()) names.push(dir);
    }
    return names;
  } catch (error) {
    console.warn("Nie można wczytać kategorii:", error);
    return [];
  }
}

export async function createCategory(id: string): Promise<string> {
  const safeId = sanitizeSegment(id);
  if (!safeId) throw new Error("Nieprawidłowa nazwa kategorii");
  const dirPath = path.join(categoriesBase(), safeId);
  await ensureDir(dirPath);
  return safeId;
}

export async function renameCategory(oldId: string, newId: string): Promise<string> {
  const safeNewId = sanitizeSegment(newId);
  if (!safeNewId) throw new Error("Nieprawidłowa nazwa kategorii");
  const oldPath = resolveCategoryDir(oldId);
  const newPath = path.join(categoriesBase(), safeNewId);
  await fs.rename(oldPath, newPath);
  return safeNewId;
}

export async function deleteCategory(id: string): Promise<void> {
  const dirPath = resolveCategoryDir(id);
  await fs.rm(dirPath, { recursive: true, force: true });
}

export async function addCategoryFile(
  categoryId: string,
  filename: string,
  data: Buffer
): Promise<string> {
  const safeName = buildSafeFilename(filename);
  if (!isMediaFile(categoryId, safeName)) {
    throw new Error("Nieobsługiwany typ pliku dla tej kategorii");
  }
  const dirPath = resolveCategoryDir(categoryId);
  await ensureDir(dirPath);
  const filePath = path.join(dirPath, safeName);
  await fs.writeFile(filePath, data);

  const order = await readMediaOrder(dirPath);
  if (order) {
    await writeMediaOrder(dirPath, [...order, safeName]);
  }

  return safeName;
}

export async function renameCategoryFile(
  categoryId: string,
  oldFilename: string,
  newFilename: string
): Promise<string> {
  const ext = path.extname(oldFilename).toLowerCase();
  const rawBase = newFilename.replace(/\.[^.]+$/, "");
  const safeName = `${sanitizeFileBaseName(rawBase) || "plik"}${ext}`;
  const dirPath = resolveCategoryDir(categoryId);
  const oldPath = path.join(dirPath, oldFilename);
  const newPath = path.join(dirPath, safeName);
  await fs.rename(oldPath, newPath);

  const order = await readMediaOrder(dirPath);
  if (order) {
    await writeMediaOrder(
      dirPath,
      order.map(name => (name === oldFilename ? safeName : name))
    );
  }

  return safeName;
}

export async function deleteCategoryFile(categoryId: string, filename: string): Promise<void> {
  const dirPath = resolveCategoryDir(categoryId);
  const filePath = path.join(dirPath, filename);
  await fs.unlink(filePath);

  const order = await readMediaOrder(dirPath);
  if (order) {
    const next = order.filter(name => name !== filename);
    if (next.length > 0) {
      await writeMediaOrder(dirPath, next);
    } else {
      await fs.unlink(mediaOrderPath(dirPath)).catch(() => undefined);
    }
  }
}

export async function addAvatar(filename: string, data: Buffer): Promise<string> {
  await ensureDir(avatarsBase());
  const safeName = buildSafeFilename(filename);
  if (!IMAGE_EXTENSIONS.test(safeName)) {
    throw new Error("Avatar musi być obrazem (png, jpg, webp, gif, svg)");
  }
  const filePath = path.join(avatarsBase(), safeName);
  await fs.writeFile(filePath, data);
  return safeName;
}

export async function deleteAvatar(filename: string): Promise<void> {
  const filePath = path.join(avatarsBase(), decodeURIComponent(filename));
  await fs.unlink(filePath);
}
