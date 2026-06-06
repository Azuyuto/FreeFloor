#!/usr/bin/env node
/**
 * Generuje 25 śmiesznych avatarów SVG do public/avatars/
 * Kategorie: wesele, escape room, giełda, taniec, alkohol, impreza, muzyka, podróże
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AVATARS_DIR = path.join(__dirname, "..", "public", "avatars");

function avatarSvg({ bg, body, label }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="${label}">
  <defs>
    <clipPath id="circle"><circle cx="256" cy="256" r="248"/></clipPath>
  </defs>
  <rect width="512" height="512" fill="${bg}"/>
  <g clip-path="url(#circle)">
    ${body}
  </g>
  <circle cx="256" cy="256" r="248" fill="none" stroke="#ffffff" stroke-width="10" opacity="0.35"/>
</svg>`;
}

const avatars = [
  // wesele (3)
  {
    file: "wesele_pan_mlody_z_tortem.svg",
    label: "Pan młody z tortem na głowie",
    bg: "#fce7f3",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.12"/>
      <rect x="176" y="300" width="160" height="120" rx="24" fill="#1e3a8a"/>
      <rect x="196" y="330" width="120" height="18" fill="#fff"/>
      <circle cx="256" cy="210" r="78" fill="#fcd9b6"/>
      <ellipse cx="256" cy="120" rx="90" ry="36" fill="#111827"/>
      <rect x="178" y="88" width="156" height="44" rx="18" fill="#111827"/>
      <ellipse cx="256" cy="155" rx="88" ry="22" fill="#fbbf24"/>
      <circle cx="228" cy="205" r="10" fill="#111"/><circle cx="284" cy="205" r="10" fill="#111"/>
      <path d="M236 238 Q256 258 276 238" stroke="#111" stroke-width="6" fill="none" stroke-linecap="round"/>
      <ellipse cx="256" cy="70" rx="72" ry="28" fill="#fff" stroke="#f472b6" stroke-width="6"/>
      <text x="256" y="78" text-anchor="middle" font-size="22" font-family="Arial,sans-serif" fill="#db2777">💍</text>
    `,
  },
  {
    file: "wesele_panna_z_bukietem.svg",
    label: "Panna młoda łapiąca bukiet",
    bg: "#fdf2f8",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.12"/>
      <path d="M170 420 Q256 280 342 420 Z" fill="#fff"/>
      <circle cx="256" cy="200" r="72" fill="#fde68a"/>
      <path d="M170 150 Q256 60 342 150 L330 220 Q256 180 182 220 Z" fill="#f9a8d4"/>
      <circle cx="232" cy="198" r="9" fill="#111"/><circle cx="280" cy="198" r="9" fill="#111"/>
      <ellipse cx="256" cy="228" rx="18" ry="10" fill="#fb7185"/>
      <g transform="translate(330,250) rotate(18)">
        <circle cx="0" cy="0" r="34" fill="#22c55e"/>
        <circle cx="-12" cy="-8" r="10" fill="#ef4444"/>
        <circle cx="12" cy="-8" r="10" fill="#f59e0b"/>
        <circle cx="0" cy="12" r="10" fill="#ec4899"/>
      </g>
      <text x="90" y="180" font-size="48" font-family="Arial">✋</text>
    `,
  },
  {
    file: "wesele_gosc_z_krawatem.svg",
    label: "Gość weselny z krzywym krawatem",
    bg: "#eef2ff",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.12"/>
      <rect x="170" y="290" width="172" height="130" rx="20" fill="#334155"/>
      <polygon points="256,300 286,420 226,420" fill="#ef4444"/>
      <polygon points="256,300 310,410 256,390" fill="#b91c1c"/>
      <circle cx="256" cy="205" r="70" fill="#f5d0a9"/>
      <rect x="186" y="130" width="140" height="50" rx="16" fill="#4b5563"/>
      <circle cx="232" cy="200" r="9" fill="#111"/><circle cx="280" cy="200" r="9" fill="#111"/>
      <path d="M230 230 Q256 248 290 222" stroke="#111" stroke-width="5" fill="none"/>
      <text x="330" y="150" font-size="36">🥂</text>
    `,
  },

  // escape room (3)
  {
    file: "escape_uciekinier.svg",
    label: "Uciekinier z kajdanek",
    bg: "#1f2937",
    body: `
      <rect width="512" height="512" fill="#111827"/>
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#fff" opacity="0.08"/>
      <circle cx="256" cy="210" r="78" fill="#d4a574"/>
      <rect x="180" y="120" width="152" height="42" rx="12" fill="#3f1d0f"/>
      <circle cx="228" cy="205" r="12" fill="#fff"/><circle cx="284" cy="205" r="12" fill="#fff"/>
      <circle cx="228" cy="205" r="5" fill="#111"/><circle cx="284" cy="205" r="5" fill="#111"/>
      <ellipse cx="256" cy="250" rx="28" ry="18" fill="#111"/>
      <rect x="150" y="300" width="212" height="110" rx="18" fill="#374151"/>
      <text x="90" y="360" font-size="52">⛓️</text>
      <text x="330" y="120" font-size="42">🚪</text>
      <text x="70" y="180" font-size="28" fill="#fbbf24" font-family="monospace">4:59</text>
    `,
  },
  {
    file: "escape_detektyw.svg",
    label: "Detektyw escape room",
    bg: "#0f172a",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#fff" opacity="0.08"/>
      <rect x="160" y="290" width="192" height="120" rx="20" fill="#78350f"/>
      <circle cx="256" cy="200" r="74" fill="#f1c27d"/>
      <ellipse cx="256" cy="150" rx="88" ry="34" fill="#451a03"/>
      <circle cx="232" cy="198" r="10" fill="#111"/><circle cx="280" cy="198" r="10" fill="#111"/>
      <circle cx="330" cy="250" r="48" fill="none" stroke="#94a3b8" stroke-width="10"/>
      <line x1="368" y1="288" x2="410" y2="330" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
      <text x="80" y="250" font-size="34" fill="#facc15" font-family="monospace">?</text>
      <text x="80" y="300" font-size="34" fill="#facc15" font-family="monospace">7</text>
    `,
  },
  {
    file: "escape_kod_na_scianie.svg",
    label: "Gracz przerażony kodem",
    bg: "#312e81",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.2"/>
      <circle cx="256" cy="220" r="80" fill="#fde68a"/>
      <path d="M176 150 Q256 80 336 150 L320 210 Q256 170 192 210 Z" fill="#4c1d95"/>
      <ellipse cx="220" cy="210" rx="16" ry="22" fill="#fff"/><ellipse cx="292" cy="210" rx="16" ry="22" fill="#fff"/>
      <circle cx="220" cy="215" r="7" fill="#111"/><circle cx="292" cy="215" r="7" fill="#111"/>
      <ellipse cx="256" cy="270" rx="22" ry="30" fill="#111"/>
      <rect x="330" y="90" width="120" height="70" rx="10" fill="#111" stroke="#22d3ee" stroke-width="4"/>
      <text x="345" y="138" font-size="28" fill="#22d3ee" font-family="monospace">8 2 5</text>
      <text x="60" y="120" font-size="40">🔐</text>
    `,
  },

  // giełda (3)
  {
    file: "gielda_byk_w_krawacie.svg",
    label: "Byk giełdowy w krawacie",
    bg: "#ecfdf5",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.1"/>
      <ellipse cx="256" cy="260" rx="120" ry="100" fill="#b45309"/>
      <path d="M150 180 Q180 120 220 150 Q256 90 292 150 Q332 120 362 180" fill="#92400e"/>
      <ellipse cx="210" cy="240" rx="18" ry="22" fill="#fff"/><ellipse cx="302" cy="240" rx="18" ry="22" fill="#fff"/>
      <circle cx="210" cy="245" r="8" fill="#111"/><circle cx="302" cy="245" r="8" fill="#111"/>
      <ellipse cx="256" cy="300" rx="26" ry="18" fill="#7f1d1d"/>
      <rect x="226" y="330" width="60" height="70" rx="8" fill="#1d4ed8"/>
      <polygon points="256,330 276,390 236,390" fill="#dc2626"/>
      <polyline points="80,360 130,300 180,330 230,220 280,250 330,180" fill="none" stroke="#16a34a" stroke-width="10" stroke-linecap="round"/>
      <text x="350" y="120" font-size="40">📈</text>
    `,
  },
  {
    file: "gielda_niedzwiedz.svg",
    label: "Niedźwiedź giełdowy",
    bg: "#fef2f2",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.1"/>
      <circle cx="180" cy="150" r="34" fill="#6b7280"/><circle cx="332" cy="150" r="34" fill="#6b7280"/>
      <ellipse cx="256" cy="250" rx="110" ry="95" fill="#9ca3af"/>
      <ellipse cx="220" cy="235" rx="16" ry="20" fill="#fff"/><ellipse cx="292" cy="235" rx="16" ry="20" fill="#fff"/>
      <circle cx="220" cy="240" r="7" fill="#111"/><circle cx="292" cy="240" r="7" fill="#111"/>
      <ellipse cx="256" cy="285" rx="20" ry="12" fill="#374151"/>
      <polyline points="380,120 330,200 280,180 230,260 180,240 120,300" fill="none" stroke="#dc2626" stroke-width="10" stroke-linecap="round"/>
      <text x="70" y="130" font-size="36">📉</text>
      <text x="300" y="380" font-size="28" fill="#991b1b" font-family="Arial">-42%</text>
    `,
  },
  {
    file: "gielda_trader_z_monitorami.svg",
    label: "Trader z monitorami",
    bg: "#f8fafc",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.1"/>
      <rect x="70" y="80" width="90" height="60" rx="6" fill="#111"/><rect x="180" y="80" width="90" height="60" rx="6" fill="#111"/>
      <rect x="290" y="80" width="90" height="60" rx="6" fill="#111"/><rect x="400" y="80" width="90" height="60" rx="6" fill="#111" opacity="0.0"/>
      <rect x="125" y="150" width="90" height="60" rx="6" fill="#111"/><rect x="235" y="150" width="90" height="60" rx="6" fill="#111"/>
      <rect x="345" y="150" width="90" height="60" rx="6" fill="#111"/>
      <polyline points="80,120 130,100 150,110" stroke="#22c55e" stroke-width="4" fill="none"/>
      <polyline points="190,120 240,95 250,105" stroke="#ef4444" stroke-width="4" fill="none"/>
      <circle cx="256" cy="285" r="62" fill="#f5d0a9"/>
      <ellipse cx="256" cy="230" rx="70" ry="24" fill="#111"/>
      <circle cx="236" cy="280" r="8" fill="#111"/><circle cx="276" cy="280" r="8" fill="#111"/>
      <rect x="206" y="350" width="100" height="60" rx="10" fill="#0f172a"/>
      <text x="220" y="390" font-size="28">☕</text>
    `,
  },

  // taniec (3)
  {
    file: "taniec_disco_glowa.svg",
    label: "Głowa dyskotekowa",
    bg: "#2e1065",
    body: `
      <defs>
        <radialGradient id="disco">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="35%" stop-color="#a855f7"/>
          <stop offset="70%" stop-color="#22d3ee"/>
          <stop offset="100%" stop-color="#ec4899"/>
        </radialGradient>
      </defs>
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#fff" opacity="0.1"/>
      <circle cx="256" cy="240" r="110" fill="url(#disco)"/>
      <g stroke="#fff" stroke-width="4" opacity="0.7">
        <line x1="256" y1="130" x2="256" y2="350"/><line x1="146" y1="240" x2="366" y2="240"/>
        <line x1="178" y1="162" x2="334" y2="318"/><line x1="334" y1="162" x2="178" y2="318"/>
      </g>
      <circle cx="220" cy="225" r="14" fill="#111"/><circle cx="292" cy="225" r="14" fill="#111"/>
      <path d="M220 280 Q256 310 292 280" stroke="#111" stroke-width="6" fill="none"/>
      <rect x="196" y="360" width="120" height="50" rx="12" fill="#111"/>
      <text x="220" y="395" font-size="28">🕺</text>
    `,
  },
  {
    file: "taniec_balerina_sneakers.svg",
    label: "Balerina w sneakersach",
    bg: "#fdf4ff",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.08"/>
      <path d="M190 420 Q256 260 322 420 Z" fill="#fce7f3"/>
      <circle cx="256" cy="190" r="58" fill="#fde68a"/>
      <ellipse cx="256" cy="140" rx="52" ry="20" fill="#831843"/>
      <circle cx="236" cy="188" r="7" fill="#111"/><circle cx="276" cy="188" r="7" fill="#111"/>
      <path d="M150 250 Q190 180 230 300" stroke="#be185d" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M362 250 Q322 180 282 300" stroke="#be185d" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="210" cy="410" rx="34" ry="16" fill="#ef4444"/>
      <ellipse cx="302" cy="410" rx="34" ry="16" fill="#3b82f6"/>
      <text x="205" y="418" font-size="18" fill="#fff" font-family="Arial">NIKE?</text>
    `,
  },
  {
    file: "taniec_breakdance_spin.svg",
    label: "Breakdancer w spinie",
    bg: "#fff7ed",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.1"/>
      <g transform="translate(256,260) rotate(-24)">
        <circle cx="0" cy="-60" r="42" fill="#8b5cf6"/>
        <rect x="-28" y="-10" width="56" height="90" rx="16" fill="#f59e0b"/>
        <rect x="-70" y="20" width="56" height="18" rx="8" fill="#111"/>
        <rect x="14" y="0" width="56" height="18" rx="8" fill="#111"/>
        <rect x="-18" y="80" width="36" height="60" rx="10" fill="#1d4ed8"/>
      </g>
      <circle cx="256" cy="250" r="100" fill="none" stroke="#fb923c" stroke-width="8" stroke-dasharray="16 12"/>
      <text x="80" y="120" font-size="40">🎵</text>
      <text x="330" y="360" font-size="36">💫</text>
    `,
  },

  // alkohol (3)
  {
    file: "alkohol_koktajl_z_oczami.svg",
    label: "Koktajl z oczami",
    bg: "#ecfeff",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.08"/>
      <path d="M196 360 L236 140 L276 140 L316 360 Z" fill="#67e8f9" stroke="#0891b2" stroke-width="6"/>
      <ellipse cx="256" cy="150" rx="52" ry="18" fill="#22d3ee"/>
      <circle cx="230" cy="250" r="16" fill="#fff"/><circle cx="282" cy="250" r="16" fill="#fff"/>
      <circle cx="230" cy="255" r="7" fill="#111"/><circle cx="282" cy="255" r="7" fill="#111"/>
      <path d="M230 300 Q256 330 282 300" stroke="#111" stroke-width="5" fill="none"/>
      <line x1="276" y1="130" x2="310" y2="90" stroke="#111" stroke-width="6" stroke-linecap="round"/>
      <circle cx="318" cy="82" r="10" fill="#ef4444"/>
      <text x="90" y="180" font-size="40">🍋</text>
    `,
  },
  {
    file: "alkohol_winiarz.svg",
    label: "Winiarz z ogromnym kieliszkiem",
    bg: "#faf5ff",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.08"/>
      <circle cx="220" cy="220" r="55" fill="#f5d0a9"/>
      <ellipse cx="220" cy="170" rx="50" ry="22" fill="#fff"/>
      <circle cx="204" cy="215" r="7" fill="#111"/><circle cx="236" cy="215" r="7" fill="#111"/>
      <path d="M330 360 L350 120 L390 120 L410 360 Z" fill="#7f1d1d"/>
      <ellipse cx="370" cy="130" rx="40" ry="14" fill="#991b1b"/>
      <ellipse cx="370" cy="250" rx="46" ry="60" fill="#7f1d1d" opacity="0.5"/>
      <text x="300" y="90" font-size="28" fill="#4c0519">Bordeaux XL</text>
    `,
  },
  {
    file: "alkohol_piwo_w_szlafroku.svg",
    label: "Piwo w szlafroku",
    bg: "#fffbeb",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.08"/>
      <rect x="176" y="300" width="160" height="100" rx="24" fill="#fde68a" stroke="#d97706" stroke-width="6"/>
      <rect x="196" y="180" width="120" height="130" rx="30" fill="#fbbf24"/>
      <ellipse cx="256" cy="175" rx="62" ry="24" fill="#fff"/>
      <circle cx="230" cy="250" r="12" fill="#fff"/><circle cx="282" cy="250" r="12" fill="#fff"/>
      <circle cx="230" cy="255" r="5" fill="#111"/><circle cx="282" cy="255" r="5" fill="#111"/>
      <path d="M232 290 Q256 310 280 290" stroke="#111" stroke-width="5" fill="none"/>
      <text x="210" y="360" font-size="34">🍺</text>
      <text x="300" y="150" font-size="24">ZZZ</text>
    `,
  },

  // impreza (3)
  {
    file: "impreza_konfetti_wlosy.svg",
    label: "Imprezowicz z konfetti w włosach",
    bg: "#fdf2f8",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.08"/>
      <circle cx="256" cy="210" r="78" fill="#fcd9b6"/>
      <path d="M170 170 Q200 80 256 100 Q312 80 342 170 L330 240 Q256 200 182 240 Z" fill="#7c3aed"/>
      <circle cx="190" cy="120" r="8" fill="#ef4444"/><circle cx="230" cy="90" r="8" fill="#22c55e"/>
      <circle cx="290" cy="95" r="8" fill="#eab308"/><circle cx="330" cy="130" r="8" fill="#3b82f6"/>
      <circle cx="228" cy="205" r="10" fill="#111"/><circle cx="284" cy="205" r="10" fill="#111"/>
      <path d="M230 240 Q256 270 290 235" stroke="#111" stroke-width="6" fill="none"/>
      <rect x="180" y="300" width="152" height="100" rx="20" fill="#ec4899"/>
      <text x="330" y="320" font-size="44">🎉</text>
    `,
  },
  {
    file: "impreza_dj_kaktus.svg",
    label: "DJ z kaktusem",
    bg: "#111827",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#fff" opacity="0.08"/>
      <rect x="80" y="300" width="352" height="70" rx="12" fill="#374151"/>
      <circle cx="130" cy="335" r="18" fill="#111"/><circle cx="190" cy="335" r="18" fill="#111"/>
      <rect x="240" y="315" width="160" height="40" rx="8" fill="#111"/>
      <circle cx="256" cy="200" r="70" fill="#f5d0a9"/>
      <rect x="186" y="120" width="140" height="48" rx="14" fill="#111"/>
      <rect x="206" y="132" width="100" height="24" rx="6" fill="#22d3ee"/>
      <circle cx="232" cy="198" r="9" fill="#111"/><circle cx="280" cy="198" r="9" fill="#111"/>
      <ellipse cx="360" cy="250" rx="28" ry="50" fill="#16a34a"/>
      <ellipse cx="360" cy="210" rx="18" ry="8" fill="#16a34a"/>
      <text x="350" y="180" font-size="22">🌵</text>
    `,
  },
  {
    file: "impreza_after_party.svg",
    label: "After party survivor",
    bg: "#1e1b4b",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#fff" opacity="0.06"/>
      <circle cx="256" cy="220" r="80" fill="#86efac" opacity="0.85"/>
      <ellipse cx="256" cy="160" rx="90" ry="30" fill="#14532d"/>
      <ellipse cx="228" cy="215" rx="18" ry="10" fill="#111"/><ellipse cx="284" cy="215" rx="18" ry="10" fill="#111"/>
      <ellipse cx="256" cy="255" rx="24" ry="14" fill="#111"/>
      <rect x="170" y="300" width="172" height="90" rx="18" fill="#312e81"/>
      <text x="90" y="150" font-size="34">🌅</text>
      <text x="320" y="360" font-size="30">4:20</text>
      <text x="180" y="360" font-size="22" fill="#a5b4fc">pomidor</text>
    `,
  },

  // muzyka (3)
  {
    file: "muzyka_rockstar_szczotka.svg",
    label: "Rockstar ze szczotką zamiast gitary",
    bg: "#fef2f2",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.08"/>
      <circle cx="256" cy="200" r="72" fill="#f5d0a9"/>
      <path d="M180 130 Q256 50 332 130 L320 210 Q256 170 192 210 Z" fill="#111"/>
      <circle cx="232" cy="195" r="9" fill="#111"/><circle cx="280" cy="195" r="9" fill="#111"/>
      <rect x="300" y="240" width="28" height="140" rx="8" fill="#dc2626" transform="rotate(24 314 310)"/>
      <rect x="318" y="220" width="50" height="30" rx="6" fill="#9ca3af" transform="rotate(24 343 235)"/>
      <text x="80" y="280" font-size="48">🎸→🧹</text>
    `,
  },
  {
    file: "muzyka_rapper_banan.svg",
    label: "Rapper z mikrofonem-bananym",
    bg: "#fefce8",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.08"/>
      <circle cx="256" cy="210" r="74" fill="#8b5e34"/>
      <ellipse cx="256" cy="150" rx="80" ry="28" fill="#111"/>
      <circle cx="232" cy="205" r="10" fill="#111"/><circle cx="280" cy="205" r="10" fill="#111"/>
      <rect x="206" y="300" width="100" height="90" rx="16" fill="#facc15"/>
      <path d="M330 180 Q360 120 390 180 Q360 240 330 180" fill="#fde047" stroke="#ca8a04" stroke-width="4"/>
      <rect x="350" y="150" width="18" height="50" rx="6" fill="#111"/>
      <text x="80" y="180" font-size="28" fill="#854d0e">yo yo</text>
    `,
  },
  {
    file: "muzyka_smutny_klarnecista.svg",
    label: "Smutny klarnecista",
    bg: "#f0f9ff",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.08"/>
      <circle cx="256" cy="220" r="70" fill="#fde68a"/>
      <rect x="190" y="140" width="132" height="40" rx="12" fill="#4b5563"/>
      <path d="M220 250 Q256 230 292 250" stroke="#111" stroke-width="5" fill="none"/>
      <ellipse cx="228" cy="210" rx="12" ry="16" fill="#111"/><ellipse cx="284" cy="210" rx="12" ry="16" fill="#111"/>
      <rect x="300" y="180" width="24" height="160" rx="10" fill="#111"/>
      <ellipse cx="312" cy="175" rx="18" ry="10" fill="#9ca3af"/>
      <text x="90" y="300" font-size="40">😢</text>
      <text x="330" y="120" font-size="22" fill="#64748b">do# minor</text>
    `,
  },

  // podróże (4)
  {
    file: "podroze_plecak_gigant.svg",
    label: "Turysta z gigantycznym plecakiem",
    bg: "#ecfeff",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.08"/>
      <circle cx="256" cy="240" r="52" fill="#f5d0a9"/>
      <circle cx="240" cy="235" r="6" fill="#111"/><circle cx="272" cy="235" r="6" fill="#111"/>
      <rect x="150" y="120" width="212" height="220" rx="30" fill="#f97316"/>
      <rect x="180" y="90" width="152" height="40" rx="12" fill="#ea580c"/>
      <rect x="206" y="300" width="44" height="80" rx="10" fill="#1e3a8a"/>
      <rect x="262" y="300" width="44" height="80" rx="10" fill="#1e3a8a"/>
      <text x="190" y="220" font-size="28">🏕️</text>
      <text x="300" y="180" font-size="28">🧦</text>
    `,
  },
  {
    file: "podroze_pilot_walizka.svg",
    label: "Pilot z walizką",
    bg: "#eff6ff",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.08"/>
      <circle cx="230" cy="220" r="58" fill="#f5d0a9"/>
      <rect x="170" y="280" width="120" height="100" rx="16" fill="#1e3a8a"/>
      <rect x="188" y="160" width="84" height="24" rx="8" fill="#111"/>
      <circle cx="210" cy="215" r="7" fill="#111"/><circle cx="250" cy="215" r="7" fill="#111"/>
      <rect x="300" y="260" width="120" height="90" rx="14" fill="#64748b"/>
      <rect x="350" y="230" width="40" height="20" rx="6" fill="#94a3b8"/>
      <text x="320" y="180" font-size="40">✈️</text>
      <text x="90" y="180" font-size="30">🧭</text>
    `,
  },
  {
    file: "podroze_gps_lost.svg",
    label: "Zgubiony na mapie",
    bg: "#f0fdf4",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.08"/>
      <circle cx="256" cy="220" r="72" fill="#fde68a"/>
      <path d="M180 150 Q256 80 332 150 L320 230 Q256 190 192 230 Z" fill="#854d0e"/>
      <ellipse cx="228" cy="215" rx="14" ry="18" fill="#fff"/><ellipse cx="284" cy="215" rx="14" ry="18" fill="#fff"/>
      <path d="M230 260 Q256 240 282 260" stroke="#111" stroke-width="5" fill="none"/>
      <rect x="90" y="90" width="150" height="110" rx="12" fill="#d1fae5" stroke="#059669" stroke-width="4"/>
      <path d="M110 170 L150 130 L190 160 L220 110" stroke="#10b981" stroke-width="5" fill="none"/>
      <text x="110" y="130" font-size="22" fill="#047857">GPS?</text>
      <text x="300" y="340" font-size="36">🗺️</text>
    `,
  },
  {
    file: "podroze_walizka_na_plazy.svg",
    label: "Walizka na plaży",
    bg: "#fff7ed",
    body: `
      <ellipse cx="256" cy="430" rx="150" ry="28" fill="#000" opacity="0.08"/>
      <rect x="0" y="320" width="512" height="120" fill="#fde68a"/>
      <path d="M0 320 Q128 280 256 320 T512 320 L512 440 L0 440 Z" fill="#38bdf8"/>
      <rect x="196" y="180" width="120" height="150" rx="18" fill="#ef4444"/>
      <rect x="216" y="150" width="80" height="30" rx="8" fill="#b91c1c"/>
      <circle cx="256" cy="250" r="10" fill="#fff"/>
      <path d="M120 300 Q180 260 240 300" stroke="#fff" stroke-width="8" fill="none" opacity="0.7"/>
      <text x="330" y="260" font-size="48">🌴</text>
      <text x="80" y="260" font-size="40">☀️</text>
      <text x="210" y="390" font-size="22" fill="#92400e">wakacje.exe</text>
    `,
  },
];

async function main() {
  await fs.mkdir(AVATARS_DIR, { recursive: true });

  let created = 0;
  for (const avatar of avatars) {
    const svg = avatarSvg(avatar);
    const target = path.join(AVATARS_DIR, avatar.file);
    await fs.writeFile(target, svg, "utf8");
    created++;
    console.log(`✓ ${avatar.file} — ${avatar.label}`);
  }

  console.log(`\nUtworzono ${created} avatarów w ${AVATARS_DIR}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
