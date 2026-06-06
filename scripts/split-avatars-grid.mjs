#!/usr/bin/env node
/**
 * Dzieli avatars.png (siatka 5×5) na 25 osobnych PNG w public/avatars/
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "avatars.png");
const OUT_DIR = path.join(ROOT, "public", "avatars");

const COLS = 5;
const ROWS = 5;

/** Kolejność: wiersz po wierszu, od lewej (na podstawie zawartości kafelków) */
const TILE_NAMES = [
  // rząd 1 — wesele, escape, giełda, taniec, alkohol
  "wesele_para_mloda",
  "escape_przestraszony_gracz",
  "gielda_byk_w_okularach",
  "taniec_banan_disco",
  "alkohol_pijany_kubek",

  // rząd 2
  "wesele_przestraszony_tort",
  "escape_klucz_z_mapa",
  "gielda_zestresowany_niedzwiedz",
  "muzyka_tanczacy_boombox",
  "alkohol_szczesliwe_piwo",

  // rząd 3
  "wesele_auto_just_married",
  "escape_toaleta_zagadka_23",
  "gielda_wall_street_bets",
  "impreza_kula_dyskotekowa",
  "alkohol_martini_koktajl",

  // rząd 4
  "alkohol_pijany_w_smokingu",
  "escape_detektyw_lupa",
  "gielda_bitcoin_rakieta",
  "muzyka_dinozaur_dj",
  "alkohol_kac_kawa_never_again",

  // rząd 5 — podróże, escape, giełda, podróże, impreza
  "podroze_walizki_plaza",
  "escape_uciekinierzy_59_59",
  "gielda_stos_banknotow",
  "podroze_turysta_walizka",
  "impreza_ananas_koktajl",
];

function tileBounds(width, height, col, row) {
  const left = Math.round((col * width) / COLS);
  const top = Math.round((row * height) / ROWS);
  const right = Math.round(((col + 1) * width) / COLS);
  const bottom = Math.round(((row + 1) * height) / ROWS);
  return { left, top, width: right - left, height: bottom - top };
}

async function main() {
  try {
    await fs.access(SOURCE);
  } catch {
    console.error(`Brak pliku: ${SOURCE}`);
    console.error("Umieść avatars.png w katalogu głównym projektu.");
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  const image = sharp(SOURCE);
  const { width, height } = await image.metadata();

  if (!width || !height) {
    throw new Error("Nie można odczytać wymiarów obrazu.");
  }

  console.log(`Źródło: ${SOURCE} (${width}×${height})`);
  console.log(`Siatka: ${COLS}×${ROWS} → ${TILE_NAMES.length} kafelków\n`);

  let index = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const name = TILE_NAMES[index];
      if (!name) throw new Error(`Brak nazwy dla kafelka ${index + 1}`);

      const bounds = tileBounds(width, height, col, row);
      const filename = `${name}.png`;
      const target = path.join(OUT_DIR, filename);

      await image
        .clone()
        .extract(bounds)
        .png({ compressionLevel: 9 })
        .toFile(target);

      console.log(`✓ [${row + 1},${col + 1}] ${filename} (${bounds.width}×${bounds.height})`);
      index++;
    }
  }

  console.log(`\nZapisano ${index} avatarów w ${OUT_DIR}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
