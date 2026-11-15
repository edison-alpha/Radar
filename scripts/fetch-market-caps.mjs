// Supplementary market caps for protocols that record a token but carry no market cap in the sealed
// snapshot (DefiLlama attaches the cap to one parent entry per token; siblings keep only the symbol).
// Development-time fetch from CoinGecko's public markets endpoint. The result is shown on the
// reference pages only, labelled with its source and date; the value model never reads it.
import { readFileSync, writeFileSync } from 'node:fs';

const API = 'https://api.coingecko.com/api/v3/coins/markets';
const snapshot = JSON.parse(readFileSync('data/snapshot.json', 'utf8').replace(/^﻿/, ''));
const targets = snapshot.protocols.filter(
  (p) => (p.gecko_id || p.symbol) && !(p.mcap_usd > 0),
);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function markets(query) {
  const url = `${API}?vs_currency=usd&per_page=250&${query}`;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (response.status === 429) {
      await sleep(30_000);
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${query.slice(0, 60)}`);
    return response.json();
  }
  throw new Error('Rate limited');
}
const chunks = (list, size) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));

const byId = new Map();
const bySymbol = new Map();
const ids = [...new Set(targets.map((p) => p.gecko_id).filter(Boolean))];
for (const group of chunks(ids, 100)) {
  for (const coin of await markets(`ids=${group.join(',')}`)) byId.set(coin.id, coin);
  await sleep(8000);
}
const symbols = [
  ...new Set(targets.filter((p) => !p.gecko_id).map((p) => p.symbol.toLowerCase())),
];
for (const group of chunks(symbols, 40)) {
  for (const coin of await markets(`symbols=${encodeURIComponent(group.join(','))}`)) {
    if (!(coin.market_cap > 0)) continue;
    const key = coin.symbol.toLowerCase();
    const best = bySymbol.get(key);
    // several tokens can share a ticker: keep the one with the largest market cap
    if (!best || coin.market_cap > best.market_cap) bySymbol.set(key, coin);
  }
  await sleep(8000);
}

const items = {};
for (const p of targets) {
  const coin = p.gecko_id ? byId.get(p.gecko_id) : bySymbol.get(p.symbol.toLowerCase());
  if (!coin || !(coin.market_cap > 0)) continue;
  items[p.slug] = {
    mcap_usd: Math.round(coin.market_cap),
    coingecko_id: coin.id,
    token: coin.name,
    matched_by: p.gecko_id ? 'gecko_id' : 'symbol',
  };
}
writeFileSync(
  'data/market-caps.json',
  JSON.stringify(
    {
      source: 'CoinGecko /coins/markets (public API)',
      fetched_at: new Date().toISOString().slice(0, 10),
      note: 'Supplementary: shown on reference pages, never read by the value model.',
      requested: targets.length,
      resolved: Object.keys(items).length,
      items,
    },
    null,
    2,
  ) + '\n',
);
console.log(`Resolved ${Object.keys(items).length}/${targets.length} market caps.`);
