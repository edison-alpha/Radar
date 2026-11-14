// Development-only: downloads DefiLlama TVL history for the ranked protocols and stores a compact
// local copy (public/zz-history.js). The app never calls the network; the sealed snapshot still
// drives every ranking and implied value. Run with: pnpm history:fetch
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const rows = JSON.parse(readFileSync('data/board.json', 'utf8')).rows;
const DAY = 86400;
const STEP = 2; // keep every second day
const DAYS = 365;
mkdirSync('.cache/tvl-history', { recursive: true });

async function load(slug) {
  const cache = `.cache/tvl-history/${slug}.json`;
  if (existsSync(cache)) return JSON.parse(readFileSync(cache, 'utf8'));
  const response = await fetch(`https://api.llama.fi/protocol/${encodeURIComponent(slug)}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = await response.json();
  const tvl = (body.tvl ?? []).map((p) => [p.date, p.totalLiquidityUSD]);
  writeFileSync(cache, JSON.stringify(tvl));
  return tvl;
}

const series = {};
const failures = [];
let latest = 0;
const queue = [...rows];
async function worker() {
  while (queue.length) {
    const { slug } = queue.shift();
    try {
      const tvl = await load(slug);
      if (tvl.length) {
        series[slug] = tvl;
        latest = Math.max(latest, tvl.at(-1)[0]);
      } else failures.push([slug, 'no data']);
    } catch (error) {
      failures.push([slug, error.message]);
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));

const out = {};
for (const [slug, tvl] of Object.entries(series)) {
  const byDay = new Map(tvl.map(([date, value]) => [Math.floor(date / DAY), value]));
  const end = Math.floor(tvl.at(-1)[0] / DAY);
  const values = [];
  let first = null;
  for (let day = end - DAYS; day <= end; day += 1) {
    if ((end - day) % STEP) continue;
    const value = byDay.get(day);
    if (value == null) {
      if (first == null) continue;
      values.push(values.at(-1) ?? 0);
    } else {
      if (first == null) first = day;
      values.push(Math.round(value / 1000));
    }
  }
  if (values.length > 3)
    out[slug] = { s: new Date(first * DAY * 1000).toISOString().slice(0, 10), v: values };
}
const payload = {
  source: 'DefiLlama /protocol/{slug} TVL history',
  fetched: new Date().toISOString().slice(0, 10),
  latest: new Date(latest * 1000).toISOString().slice(0, 10),
  step_days: STEP,
  unit: 'thousand USD',
  series: out,
};
writeFileSync('public/zz-history.js', `window.__RADAR_HISTORY__=${JSON.stringify(payload)};\n`);
console.log(
  `Saved TVL history for ${Object.keys(out).length}/${rows.length} protocols. ${failures.length} failed.`,
);
for (const [slug, reason] of failures.slice(0, 10)) console.log(`  ${slug}: ${reason}`);
