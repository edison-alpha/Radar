import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRadar, dataScript } from './lib/radar.mjs';
import { resultsText } from './lib/results.mjs';
import { buildDossier } from './vendor/makefun-board.ts';

const root = dirname(fileURLToPath(import.meta.url));
function argument(name: string, fallback: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}
const input = resolve(argument('input', '/input/snapshot.json'));
const output = resolve(argument('output', process.env.MAKEFUN_OUTPUT_DIR ?? '/output'));
const snapshot = JSON.parse(
  readFileSync(input.endsWith('.json') ? input : join(input, 'snapshot.json'), 'utf8').replace(
    /^\uFEFF/,
    '',
  ),
);
const capsPath = join(root, 'data', 'market-caps.json');
const marketCaps = existsSync(capsPath) ? JSON.parse(readFileSync(capsPath, 'utf8')) : undefined;
const radar = buildRadar(snapshot, { marketCaps });
mkdirSync(output, { recursive: true });
writeFileSync(
  join(output, 'board.json'),
  JSON.stringify({ digest: radar.board_digest, rows: radar.rows }) + '\n',
);
writeFileSync(join(output, 'data.js'), dataScript(radar));
cpSync(join(root, 'dashboard'), join(output, 'dashboard'), { recursive: true });
cpSync(join(root, 'screenshots'), join(output, 'screenshots'), { recursive: true });
mkdirSync(join(output, 'dashboard', 'a-0-results'), { recursive: true });
writeFileSync(join(output, 'dashboard', 'a-0-results', 'results.txt'), resultsText(radar));
writeFileSync(join(output, 'dossier.json'), buildDossier(output, { text_max_bytes: 65_536 }));
console.log(`Wrote ${radar.rows.length} protocols and dossier to ${output}`);
