import { MODEL, growthFactorOf, priceLaunch } from './radar.mjs';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Re-prices one protocol with a different TVL or growth, holding its other model inputs fixed. */
export function scenarioValue(
  protocol,
  { tvl = protocol.tvl_usd, growth = protocol.change_7d } = {},
) {
  return priceLaunch({
    tvl,
    intercept: protocol.model.intercept,
    elasticity: protocol.model.elasticity,
    categoryFactor: protocol.model.category_factor,
    growthFactor: growthFactorOf(growth),
    maturityFactor: protocol.model.maturity_factor,
  });
}

export function buildSensitivity(protocol, driver = 'tvl') {
  if (driver !== 'tvl' && driver !== 'growth')
    throw new Error(`Unknown sensitivity driver: ${driver}`);
  const baseline =
    driver === 'tvl' ? 0 : clamp(protocol.change_7d ?? 0, MODEL.minGrowth, MODEL.maxGrowth);
  const inputs =
    driver === 'tvl'
      ? Array.from({ length: 21 }, (_, index) => -50 + index * 5)
      : [
          ...new Set([...Array.from({ length: 17 }, (_, index) => -60 + index * 10), baseline]),
        ].sort((a, b) => a - b);
  return inputs.map((input) => {
    const tvl = driver === 'tvl' ? protocol.tvl_usd * (1 + input / 100) : protocol.tvl_usd;
    const growth = driver === 'growth' ? input : protocol.change_7d;
    return {
      x: input,
      value: scenarioValue(protocol, { tvl, growth }),
      tvl,
      growth,
      baseline: input === baseline,
    };
  });
}
