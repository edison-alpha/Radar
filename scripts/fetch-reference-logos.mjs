// Fetches the official DefiLlama icon of every protocol the board does not rank (tokens on record and
// set-aside products) and packs them into ONE sprite atlas, because the dashboard may hold at most
// 400 files. Development-time operation: it needs network access; normal startup uses the output.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const TILE = 40;
const COLS = 24;
const HOST = 'https://icons.llamao.fi/icons/protocols/';
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8').replace(/^﻿/, ''));
const snapshot = readJson('data/snapshot.json');
const ranked = new Set(readJson('data/board.json').rows.map((row) => row.slug));
const targets = snapshot.protocols.filter((p) => !ranked.has(p.slug));
mkdirSync('.cache/reference-logo-originals', { recursive: true });
mkdirSync('public/protocol-logos', { recursive: true });

async function fetchIcon(slug) {
  const cache = `.cache/reference-logo-originals/${slug}.image`;
  if (existsSync(cache)) return readFileSync(cache);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(HOST + encodeURIComponent(slug), {
        signal: AbortSignal.timeout(20_000),
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.headers.get('content-type')?.startsWith('image/')) return null;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > 8_388_608) return null;
      writeFileSync(cache, bytes);
      return bytes;
    } catch {
      /* retry once, then give the protocol its initials */
    }
  }
  return null;
}

const tiles = [];
let next = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (next < targets.length) {
      const p = targets[next++];
      const bytes = await fetchIcon(p.slug);
      if (!bytes) continue;
      try {
        const tile = await sharp(bytes, { limitInputPixels: 16_777_216 })
          .resize({ width: TILE, height: TILE, fit: 'cover' })
          .ensureAlpha()
          .png()
          .toBuffer();
        tiles.push({ slug: p.slug, tile });
      } catch {
        /* undecodable icon: initials */
      }
    }
  }),
);
tiles.sort((a, b) => (a.slug < b.slug ? -1 : 1));
const rows = Math.ceil(tiles.length / COLS);
const atlas = await sharp({
  create: {
    width: COLS * TILE,
    height: rows * TILE,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(
    tiles.map((t, i) => ({ input: t.tile, left: (i % COLS) * TILE, top: Math.floor(i / COLS) * TILE })),
  )
  .webp({ quality: 82, alphaQuality: 90, effort: 6 })
  .toBuffer();
writeFileSync('public/protocol-logos/reference-atlas.webp', atlas);
writeFileSync(
  'src/data/reference-logos.json',
  JSON.stringify({
    file: 'reference-atlas.webp',
    cols: COLS,
    rows,
    slugs: Object.fromEntries(tiles.map((t, i) => [t.slug, i])),
  }) + '\n',
);
writeFileSync(
  'docs/reference-logo-provenance.json',
  JSON.stringify(
    {
      catalog: 'DefiLlama protocol icons for protocols the board does not rank, packed in one atlas',
      source: HOST + '<slug>',
      requested: targets.length,
      packed: tiles.length,
      without_icon: targets.filter((p) => !tiles.some((t) => t.slug === p.slug)).map((p) => p.slug),
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `Packed ${tiles.length}/${targets.length} reference icons into a ${COLS * TILE}x${rows * TILE} atlas (${(atlas.length / 1024).toFixed(0)} KiB).`,
);
