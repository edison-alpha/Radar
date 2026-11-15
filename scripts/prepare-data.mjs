import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { buildRadar, dataScript } from '../lib/radar.mjs';
const snapshot = JSON.parse(
  readFileSync(new URL('../data/snapshot.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''),
);
const marketCaps = existsSync('data/market-caps.json')
  ? JSON.parse(readFileSync('data/market-caps.json', 'utf8'))
  : undefined;
const radar = buildRadar(snapshot, { marketCaps });
mkdirSync('public', { recursive: true });
writeFileSync('public/data.js', dataScript(radar));
writeFileSync('data/board.json', JSON.stringify({ digest: radar.board_digest, rows: radar.rows }, null, 2) + '\n');
console.log(
  `${radar.rows.length} ranked protocols; ${radar.watchlist_count}/${snapshot.watchlist.length} watchlist; ${radar.live_count} token-recorded protocols separated.`,
);
