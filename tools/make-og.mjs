/**
 * Dev-only: renders the 1200x630 Open Graph card.
 *
 *   cd tools && node make-og.mjs
 *
 * Drawn as SVG and rasterised with sharp so it needs no browser. Text uses a
 * system sans rather than Space Grotesk — the card is a thumbnail, and
 * embedding a webfont here is not worth the weight.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const OUT = join(fileURLToPath(new URL('..', import.meta.url)), 'assets/img/og-cover.png');

/* the same lattice motif as the hero fallback, positioned on the right */
const NODES = [
  [880, 150], [1040, 210], [960, 330], [1110, 400], [860, 440],
  [1020, 520], [760, 300], [1140, 260],
];
const EDGES = [
  [0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5], [6, 0], [6, 2], [6, 4], [7, 1], [7, 3],
];
const HUBS = [2, 3, 6];

const edges = EDGES.map(
  ([a, b]) =>
    `<line x1="${NODES[a][0]}" y1="${NODES[a][1]}" x2="${NODES[b][0]}" y2="${NODES[b][1]}" stroke="rgba(255,255,255,.16)" stroke-width="1"/>`
).join('');

const dots = NODES.map(([x, y], i) =>
  HUBS.includes(i)
    ? `<circle cx="${x}" cy="${y}" r="7" fill="#ff5a1f"/>`
    : `<circle cx="${x}" cy="${y}" r="4" fill="rgba(255,255,255,.7)"/>`
).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="82%" cy="46%" r="46%">
      <stop offset="0%" stop-color="#ff5a1f" stop-opacity=".24"/>
      <stop offset="100%" stop-color="#ff5a1f" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M60 0 L0 0 0 60" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="#080808"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  ${edges}
  ${dots}

  <rect x="80" y="118" width="44" height="2" fill="#ff5a1f"/>
  <text x="140" y="127" fill="#8a8a8a"
    font-family="Consolas, 'Courier New', monospace" font-size="17" letter-spacing="3.4">SENIOR BACKEND ENGINEER</text>

  <text x="80" y="255" fill="#ffffff"
    font-family="'Segoe UI', Helvetica, Arial, sans-serif" font-size="76" font-weight="600" letter-spacing="-2.4">I build the backend</text>
  <text x="80" y="340" font-family="'Segoe UI', Helvetica, Arial, sans-serif" font-size="76" font-weight="600" letter-spacing="-2.4">
    <tspan fill="#ff5a1f">systems</tspan><tspan fill="#ffffff">&#160;that brands</tspan>
  </text>
  <text x="80" y="425" fill="#ffffff"
    font-family="'Segoe UI', Helvetica, Arial, sans-serif" font-size="76" font-weight="600" letter-spacing="-2.4">run on.</text>

  <rect x="80" y="492" width="640" height="1" fill="rgba(255,255,255,.14)"/>

  <text x="80" y="536" fill="#ffffff"
    font-family="'Segoe UI', Helvetica, Arial, sans-serif" font-size="25" font-weight="600">Raj Tiwari</text>
  <text x="80" y="568" fill="#8a8a8a"
    font-family="Consolas, 'Courier New', monospace" font-size="16" letter-spacing="2.2">LARAVEL &#183; PHP &#183; APIS &#183; AUTOMATION &#183; AWS</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(OUT);
console.log('wrote', OUT);
