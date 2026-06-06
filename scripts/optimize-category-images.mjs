#!/usr/bin/env node
/**
 * Optymalizuje obrazy w public/categories (bez plików audio).
 *
 * Użycie:
 *   node scripts/optimize-category-images.mjs           # optymalizuj, zapisuj tylko gdy mniejszy plik
 *   node scripts/optimize-category-images.mjs --dry-run # podgląd bez zapisu
 *   node scripts/optimize-category-images.mjs --backup  # kopia zapasowa przed zmianą
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CATEGORIES_DIR = path.join(ROOT, "public", "categories");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".bmp"]);
const MAX_SIDE = 1600;
const JPEG_QUALITY = 82;
const WEBP_QUALITY = 80;
const AVIF_QUALITY = 50;
const PNG_COMPRESSION = 9;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const withBackup = args.has("--backup");

const isMusicDir = name => name.trim().startsWith("_");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function collectImages(dir, relative = "") {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const rel = path.join(relative, entry.name);
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === ".backup") continue;
      files.push(...(await collectImages(full, rel)));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;

    const categoryId = relative.split(path.sep)[0] ?? "";
    if (categoryId && isMusicDir(categoryId)) continue;

    files.push({ full, rel, ext });
  }

  return files;
}

async function optimizeImage(file) {
  const before = await fs.stat(file.full);
  const input = await sharp(file.full, { animated: file.ext === ".gif" });
  const meta = await input.metadata();

  let pipeline = input.rotate();
  const needsResize =
    (meta.width ?? 0) > MAX_SIDE || (meta.height ?? 0) > MAX_SIDE;

  if (needsResize) {
    pipeline = pipeline.resize({
      width: MAX_SIDE,
      height: MAX_SIDE,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  let output;
  switch (file.ext) {
    case ".jpg":
    case ".jpeg":
      output = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
      break;
    case ".png":
      output = await pipeline
        .png({ compressionLevel: PNG_COMPRESSION, palette: true, effort: 10 })
        .toBuffer();
      break;
    case ".webp":
      output = await pipeline.webp({ quality: WEBP_QUALITY, effort: 6 }).toBuffer();
      break;
    case ".avif":
      output = await pipeline.avif({ quality: AVIF_QUALITY, effort: 6 }).toBuffer();
      break;
    case ".gif":
      output = await pipeline.gif().toBuffer();
      break;
    default:
      output = await pipeline.toBuffer();
  }

  const saved = before.size - output.length;
  const savedPct = before.size > 0 ? ((saved / before.size) * 100).toFixed(1) : "0";

  return {
    before: before.size,
    after: output.length,
    saved,
    savedPct,
    needsResize,
    output,
    changed: output.length < before.size || needsResize,
  };
}

async function main() {
  console.log(`📂 Katalog: ${CATEGORIES_DIR}`);
  console.log(dryRun ? "🔍 Tryb podglądu (--dry-run)" : "⚙️  Optymalizacja w toku…");
  if (withBackup && !dryRun) console.log("💾 Kopie zapasowe: public/categories/.backup/\n");

  const files = await collectImages(CATEGORIES_DIR);
  console.log(`Znaleziono ${files.length} obrazów.\n`);

  let processed = 0;
  let skipped = 0;
  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    try {
      const result = await optimizeImage(file);

      totalBefore += result.before;
      totalAfter += result.after;

      if (!result.changed) {
        skipped++;
        continue;
      }

      processed++;
      const tag = dryRun ? "[podgląd]" : "[zapis]";
      console.log(
        `${tag} ${file.rel}: ${formatBytes(result.before)} → ${formatBytes(result.after)} (−${result.savedPct}%)`
      );

      if (dryRun) continue;

      if (withBackup) {
        const backupPath = path.join(CATEGORIES_DIR, ".backup", file.rel);
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        await fs.copyFile(file.full, backupPath);
      }

      await fs.writeFile(file.full, result.output);
    } catch (err) {
      console.warn(`⚠️  Pominięto ${file.rel}: ${err.message}`);
      skipped++;
    }
  }

  const totalSaved = totalBefore - totalAfter;
  const totalPct = totalBefore > 0 ? ((totalSaved / totalBefore) * 100).toFixed(1) : "0";

  console.log("\n--- Podsumowanie ---");
  console.log(`Przetworzono: ${processed}`);
  console.log(`Bez zmian / pominięte: ${skipped}`);
  console.log(`Rozmiar przed: ${formatBytes(totalBefore)}`);
  console.log(`Rozmiar po:    ${formatBytes(totalAfter)}`);
  console.log(`Oszczędność:   ${formatBytes(totalSaved)} (−${totalPct}%)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
