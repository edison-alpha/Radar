import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildRadar, backtest, fitCurve } from '../lib/radar.mjs';
import { ECON, boardDigest, farmEconomics } from '../lib/economics.mjs';

const snapshot = JSON.parse(
  readFileSync(new URL('../data/snapshot.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''),
);
const radar = buildRadar(snapshot);

test('every row carries the economics farmEconomics gives for the default scenario', () => {
  for (const row of radar.rows) {
    assert.deepEqual(row.economics, farmEconomics(row));
    assert.equal(row.verdict, row.economics.verdict);
    const { slice_usd, fees_usd, tbill_usd, net_usd } = row.economics;
    assert.ok(Math.abs(slice_usd - fees_usd - tbill_usd - net_usd) < 0.02);
    assert.equal(
      row.economics.verdict,
      net_usd > 0 ? 'FARM' : slice_usd > fees_usd ? 'THIN' : 'SKIP',
    );
  }
  const total = radar.verdicts.FARM + radar.verdicts.THIN + radar.verdicts.SKIP;
  assert.equal(total, radar.rows.length);
});

test('economics move the right way with capital, airdrop share and hold', () => {
  const row = radar.rows[0];
  const base = farmEconomics(row);
  assert.ok(farmEconomics(row, { share: 0.2 }).slice_usd > base.slice_usd);
  assert.ok(farmEconomics(row, { holdDays: 180 }).tbill_usd > base.tbill_usd);
  assert.ok(Math.abs(farmEconomics(row, { capital: 10000 }).tbill_usd - base.tbill_usd * 10) < 0.1);
  assert.equal(base.tbill_usd, Math.round(ECON.capital * ECON.tbillYield * (ECON.holdDays / 365) * 100) / 100);
});

test('backtest prices every token on record without itself and is deterministic', () => {
  const bt = radar.backtest;
  assert.equal(bt.leave_one_out.n, radar.curve.comparables);
  assert.equal(bt.points.length, radar.curve.comparables);
  assert.ok(bt.time_split.n >= 10 && bt.time_split.train_n >= 10);
  assert.equal(bt.time_split.n + bt.time_split.train_n, radar.curve.comparables);
  for (const result of [bt.leave_one_out, bt.time_split]) {
    assert.ok(result.model.within_3x <= result.model.within_10x);
    assert.ok(result.model.median_miss >= 1 && result.flat.median_miss >= 1);
  }
  assert.deepEqual(backtest(fitCurve(snapshot.protocols).comps), bt);
  assert.equal(backtest([]), null);
});

test('the board digest matches the rows and changes when a rank or value changes', () => {
  assert.equal(radar.board_digest, boardDigest(radar.rows));
  const changed = radar.rows.map((r, i) => (i === 3 ? { ...r, implied_value_usd: r.implied_value_usd - 1 } : r));
  assert.notEqual(boardDigest(changed), radar.board_digest);
});

test('tokens on record and set-aside products partition the rest of the snapshot', () => {
  assert.equal(radar.traded.length, radar.live_count);
  assert.equal(radar.set_aside.length, radar.excluded_count);
  const slugs = [...radar.rows, ...radar.traded, ...radar.set_aside].map((p) => p.slug);
  assert.equal(new Set(slugs).size, snapshot.protocols.length);
  assert.ok(radar.set_aside.every((p) => p.reason));
});
