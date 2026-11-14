import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSensitivity } from '../lib/sensitivity.mjs';
const rows = JSON.parse(readFileSync('data/board.json', 'utf8')).rows;

test('every protocol chart baseline exactly reproduces its board valuation', () => {
  for (const protocol of rows) {
    for (const driver of ['tvl', 'growth']) {
      const points = buildSensitivity(protocol, driver);
      assert.equal(points.filter((point) => point.baseline).length, 1);
      assert.equal(points.find((point) => point.baseline).value, protocol.implied_value_usd);
      assert.ok(points.every((point, index) => !index || point.value >= points[index - 1].value));
    }
  }
});

test('sensitivity isolates its selected driver and never invents historical points', () => {
  const protocol = rows[0];
  const tvl = buildSensitivity(protocol, 'tvl');
  assert.ok(tvl.every((point) => point.growth === protocol.change_7d));
  assert.equal(tvl[0].tvl, protocol.tvl_usd * 0.5);
  assert.equal(tvl.at(-1).tvl, protocol.tvl_usd * 1.5);
  assert.ok(buildSensitivity(protocol, 'growth').every((point) => point.tvl === protocol.tvl_usd));
  assert.throws(() => buildSensitivity(protocol, 'price-history'));
});
