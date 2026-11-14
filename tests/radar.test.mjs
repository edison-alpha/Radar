import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildRadar,
  dataScript,
  validateBoard,
  ageDays,
  isCandidate,
  median,
} from '../lib/radar.mjs';

const snapshot = JSON.parse(
  readFileSync(new URL('../data/snapshot.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''),
);
test('sealed snapshot produces a ranked board with full watchlist coverage', () => {
  const radar = buildRadar(snapshot);
  assert.ok(radar.rows.length >= 100);
  assert.equal(radar.watchlist_count, snapshot.watchlist.length);
  assert.ok(snapshot.watchlist.every((slug) => radar.rows.some((row) => row.slug === slug)));
  assert.doesNotThrow(() => validateBoard(radar.rows, snapshot));
  assert.equal(
    radar.rows.length + radar.live_count + radar.excluded_count,
    snapshot.protocols.length,
  );
});
test('output is deterministic and does not depend on wall-clock time', () => {
  assert.equal(dataScript(buildRadar(snapshot)), dataScript(buildRadar(snapshot)));
  assert.equal(ageDays('2026-11-14', '2026-11-07'), 7);
  assert.equal(ageDays('2026-11-14', null), null);
});
test('candidate classification rejects live identifiers and derivative products', () => {
  const base = {
    name: 'Sample',
    gecko_id: null,
    symbol: null,
    mcap_usd: null,
    category: 'Lending',
  };
  assert.equal(isCandidate(base), true);
  for (const change of [
    { symbol: 'ABC' },
    { gecko_id: 'abc' },
    { mcap_usd: 50 },
    { category: 'Bridge' },
    { name: 'Wrapped Asset' },
    { name: 'Sample V2' },
  ])
    assert.equal(isCandidate({ ...base, ...change }), false);
});
test('validation refuses invented, duplicate, incomplete and incorrectly ordered rows', () => {
  const rows = buildRadar(snapshot).rows;
  assert.throws(() =>
    validateBoard([{ ...rows[0], slug: 'invented-protocol' }, ...rows.slice(1)], snapshot),
  );
  assert.throws(() => validateBoard([rows[0], ...rows.slice(0, -1)], snapshot));
  assert.throws(() => validateBoard(rows.slice(0, 30), snapshot));
  assert.throws(() => validateBoard([{ ...rows[0], rank: 3 }, ...rows.slice(1)], snapshot));
  assert.throws(() =>
    validateBoard([{ ...rows[0], farm_steps: ['short'] }, ...rows.slice(1)], snapshot),
  );
});
test('median handles odd/even populations and missing data stays explicit', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 2, 3]), 2.5);
  assert.equal(median([]), null);
  const input = structuredClone(snapshot);
  const first = input.protocols.find((p) => snapshot.watchlist.includes(p.slug));
  first.change_7d = null;
  first.listed_at = null;
  const row = buildRadar(input).rows.find((p) => p.slug === first.slug);
  assert.equal(row.model.growth_factor, 1);
  assert.equal(row.model.maturity_factor, 0.85);
  assert.equal(row.model.missing.length, 2);
});

test('launch curve is fitted from the snapshot and prices every row with one function', async () => {
  const { fitCurve, priceLaunch, growthFactorOf } = await import('../lib/radar.mjs');
  const curve = fitCurve(snapshot.protocols);
  assert.ok(curve.n >= 50, 'enough token-recorded comparables');
  assert.ok(curve.elasticity > 0 && curve.elasticity < 1.5);
  assert.ok(curve.q25 < 0 && curve.q75 > 0);
  const radar = buildRadar(snapshot);
  for (const row of radar.rows) {
    assert.equal(
      priceLaunch({
        tvl: row.tvl_usd,
        intercept: row.model.intercept,
        elasticity: row.model.elasticity,
        categoryFactor: row.model.category_factor,
        growthFactor: growthFactorOf(row.change_7d),
        maturityFactor: row.model.maturity_factor,
      }),
      row.implied_value_usd,
    );
    assert.ok(row.implied_low_usd <= row.implied_value_usd);
    assert.ok(row.implied_high_usd >= row.implied_value_usd);
    assert.ok(row.model.category_factor >= 0.1 && row.model.category_factor <= 10);
  }
  // Doubling every comparable's market cap must move the curve, so nothing is hardcoded.
  const doubled = structuredClone(snapshot);
  for (const p of doubled.protocols) if (p.mcap_usd > 0) p.mcap_usd *= 2;
  assert.ok(
    Math.abs(fitCurve(doubled.protocols).intercept - curve.intercept - Math.log10(2)) < 1e-9,
  );
});
test('farm plans are costed, chain-aware and differ by product type', () => {
  const rows = buildRadar(snapshot).rows;
  for (const row of rows) {
    assert.equal(row.farm_steps.length, 7);
    assert.ok(row.farm.fees_usd > 0 && row.farm.minutes > 0 && row.farm.txs > 0);
    assert.ok(row.farm_steps.every((step) => /Cost: .+\. Time: .+\./.test(step)));
    if (row.chains.length) assert.ok(row.chains.includes(row.farm.chain));
  }
  assert.ok(new Set(rows.map((row) => row.farm.action)).size >= 6);
});
