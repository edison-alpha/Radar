// Development-only: downloads DefiLlama chain icons and packs them into ONE sprite
// (public/chain-logos.webp) plus an index (src/data/chain-logos.json). One file keeps the
// dashboard's file list short. The app never calls the network. Run with: pnpm chains:fetch
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const rows = JSON.parse(readFileSync('data/board.json', 'utf8')).rows;
const chains = [...new Set(rows.flatMap((row) => row.chains))].sort();
const TILE = 48;
const COLUMNS = 12;
mkdirSync('.cache/chain-logos', { recursive: true });
const slug = (name) => name.toLowerCase().replaceAll(' ', '-');

async function load(name) {
  const cache = `.cache/chain-logos/${slug(name)}.img`;
  if (existsSync(cache)) return readFileSync(cache);
  const response = await fetch(`https://icons.llamao.fi/icons/chains/rsz_${slug(name)}?w=96&h=96`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await sharp(bytes).metadata(); // throws when the body is not an image
  writeFileSync(cache, bytes);
  return bytes;
}

const index = {};
const tiles = [];
const failures = [];
const queue = [...chains];
const loaded = new Map();
async function worker() {
  while (queue.length) {
    const name = queue.shift();
    try {
      loaded.set(name, await load(name));
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
for (const name of chains) {
  if (!loaded.has(name)) continue;
  const position = tiles.length;
  const tile = await sharp(loaded.get(name))
    .resize(TILE, TILE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  tiles.push({
    input: tile,
    left: (position % COLUMNS) * TILE,
    top: Math.floor(position / COLUMNS) * TILE,
  });
  index[name] = position;
}
const height = Math.max(1, Math.ceil(tiles.length / COLUMNS)) * TILE;
await sharp({
  create: {
    width: COLUMNS * TILE,
    height,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(tiles)
  .webp({ quality: 86 })
  .toFile('public/chain-logos.webp');
writeFileSync(
  'src/data/chain-logos.json',
  JSON.stringify({ columns: COLUMNS, count: tiles.length, index }) + '\n',
);
console.log(`Packed ${tiles.length}/${chains.length} chain logos. ${failures.length} missing.`);
for (const failure of failures.slice(0, 20)) console.log(`  ${failure}`);
