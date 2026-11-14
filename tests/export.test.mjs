import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCsv } from '../src/shared/format.js';

test('CSV includes snapshot, farm details and protects spreadsheet cells', () => {
  const csv = buildCsv([{
    rank: 1, name: '=HYPERLINK("unsafe")', slug: 'example', chains: ['Base', 'Ethereum'],
    tvl_usd: 100, change_7d: -2, watchlist: true,
    farm: { fees_usd: 1.25, minutes: 30, chain: 'Base', risk: 'Market, contract' },
    farm_steps: ['Deposit, then wait', 'Withdraw'],
  }], '2026-11-14');
  assert.ok(csv.startsWith('\uFEFF"Snapshot date (UTC)"'));
  assert.match(csv, /"'\=HYPERLINK\(""unsafe""\)"/);
  assert.match(csv, /"Base; Ethereum"/);
  assert.match(csv, /"-2"/);
  assert.match(csv, /"Farm step 2"/);
  assert.match(csv, /"Deposit, then wait"/);
  assert.match(csv, /"2026-11-14"/);
});
