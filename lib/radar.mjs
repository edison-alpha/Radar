// Token Radar value model. One sealed snapshot in, one ranked board out.
//
// 1. Split the universe: protocols with a token on record (gecko_id, symbol or market cap) are the
//    comparables; wrapped, staked, bridged, exchange and versioned products are set aside; the rest,
//    plus every watchlist slug, are the candidates the board ranks.
// 2. Fit the launch curve on the comparables, by least squares in log space:
//      log10(market cap) = intercept + elasticity x log10(TVL)
// 3. Price each candidate off that curve, then adjust:
//      implied = 10^intercept x TVL^elasticity x category x momentum x seasoning
//      category  = 10^(sum of same-category residuals, each capped at +-1 / (peers + 4)), 1 with no peers
//      momentum  = 1 + GROWTH_WEIGHT x clamp(change_7d, -60, +100) / 100, 1 when unreported
//      seasoning = 0.7 + 0.3 x min(days tracked with no token / 1095, 1), 0.85 when unknown
// 4. Report the band: the 25th and 75th percentile of the comparables' residuals, so half of the
//    priced tokens land between implied_low_usd and implied_high_usd.
// No protocol name is special-cased. Every number is derived from the snapshot it is given.

const DAY = 86_400_000;
const EXCLUDED = new Set([
  'Bridge',
  'Cross Chain Bridge',
  'Canonical Bridge',
  'Liquid Staking',
  'Liquid Restaking',
  'Restaked BTC',
  'CEX',
  'Staking Pool',
]);
export const MODEL = Object.freeze({
  version: 'radar-curve-2',
  growthWeight: 0.45,
  minGrowth: -60,
  maxGrowth: 100,
  maturityFloor: 0.7,
  maturityRange: 0.3,
  maturityDays: 1095,
  unknownMaturity: 0.85,
  categoryShrink: 4,
  residualCap: 1,
  airdropShare: 0.1,
});
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const CAP = 100_000_000_000_000;

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length
    ? sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2
    : null;
}
function quantile(sorted, q) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}
export function ageDays(asOf, listedAt) {
  if (!listedAt) return null;
  const days = (Date.parse(asOf) - Date.parse(listedAt)) / DAY;
  return Number.isFinite(days) ? Math.max(0, Math.floor(days)) : null;
}
export const recordsToken = (p) => Boolean(p.gecko_id || p.symbol || p.mcap_usd > 0);
export function isCandidate(p) {
  return (
    !recordsToken(p) &&
    !EXCLUDED.has(p.category) &&
    !/\b(wrapped|staked|staking)\b/i.test(p.name) &&
    !/\s(v\d+(\.\d+)?|\d+\.\d+)$/i.test(p.name) &&
    !/^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b/i.test(p.name)
  );
}

/** Least-squares launch curve over every token-recorded protocol with a market cap and TVL. */
export function fitCurve(protocols) {
  const comps = protocols
    .filter((p) => recordsToken(p) && p.mcap_usd > 0 && p.tvl_usd > 0)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      x: Math.log10(p.tvl_usd),
      y: Math.log10(p.mcap_usd),
    }));
  const n = comps.length;
  if (n < 3) {
    // Too few priced tokens to fit anything: fall back to a flat 0.25 x TVL line.
    return {
      intercept: Math.log10(0.25),
      elasticity: 1,
      sigma: 0,
      q25: 0,
      q75: 0,
      n,
      comps: [],
      categories: {},
    };
  }
  const mx = comps.reduce((t, c) => t + c.x, 0) / n;
  const my = comps.reduce((t, c) => t + c.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const c of comps) {
    sxy += (c.x - mx) * (c.y - my);
    sxx += (c.x - mx) ** 2;
  }
  const elasticity = sxx > 0 ? sxy / sxx : 1;
  const intercept = my - elasticity * mx;
  const categories = {};
  let sse = 0;
  for (const c of comps) {
    c.residual = c.y - (intercept + elasticity * c.x);
    sse += c.residual ** 2;
    const entry = (categories[c.category] ??= { peers: 0, sum: 0 });
    entry.peers += 1;
    entry.sum += clamp(c.residual, -MODEL.residualCap, MODEL.residualCap);
  }
  for (const entry of Object.values(categories)) {
    entry.factor = 10 ** (entry.sum / (entry.peers + MODEL.categoryShrink));
  }
  const residuals = comps.map((c) => c.residual).sort((a, b) => a - b);
  return {
    intercept,
    elasticity,
    sigma: Math.sqrt(sse / (n - 2)),
    q25: quantile(residuals, 0.25),
    q75: quantile(residuals, 0.75),
    n,
    comps,
    categories,
  };
}

/** The one pricing function: the board, the scenarios chart and the tests all call it. */
export function priceLaunch({
  tvl,
  intercept,
  elasticity,
  categoryFactor,
  growthFactor,
  maturityFactor,
}) {
  const curve = 10 ** (intercept + elasticity * Math.log10(Math.max(1, tvl)));
  return Math.max(
    1,
    Math.min(CAP, Math.round(curve * categoryFactor * growthFactor * maturityFactor)),
  );
}
export const growthFactorOf = (change7d) =>
  1 + (clamp(change7d ?? 0, MODEL.minGrowth, MODEL.maxGrowth) / 100) * MODEL.growthWeight;

export function valueProtocol(p, asOf, curve) {
  const category = curve.categories[p.category];
  const categoryFactor = category ? category.factor : 1;
  const age = ageDays(asOf, p.listed_at);
  const growthFactor = growthFactorOf(p.change_7d);
  const maturityFactor =
    age === null
      ? MODEL.unknownMaturity
      : MODEL.maturityFloor + MODEL.maturityRange * Math.min(age / MODEL.maturityDays, 1);
  const inputs = {
    tvl: p.tvl_usd,
    intercept: curve.intercept,
    elasticity: curve.elasticity,
    categoryFactor,
    growthFactor,
    maturityFactor,
  };
  const implied = priceLaunch(inputs);
  const curveValue = priceLaunch({
    ...inputs,
    categoryFactor: 1,
    growthFactor: 1,
    maturityFactor: 1,
  });
  const low = Math.max(1, Math.round(implied * 10 ** curve.q25));
  const high = Math.min(CAP, Math.round(implied * 10 ** curve.q75));
  const peers = curve.comps
    .filter((c) => c.category === p.category)
    .sort(
      (a, b) =>
        Math.abs(a.x - Math.log10(Math.max(1, p.tvl_usd))) -
          Math.abs(b.x - Math.log10(Math.max(1, p.tvl_usd))) || (a.slug < b.slug ? -1 : 1),
    )
    .slice(0, 6)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      tvl_usd: c.tvl_usd,
      mcap_usd: c.mcap_usd,
      ratio: c.mcap_usd / c.tvl_usd,
    }));
  return {
    implied_value_usd: implied,
    implied_low_usd: low,
    implied_high_usd: high,
    // What $1,000 of TVL would hold if depositors shared MODEL.airdropShare of the launch pro rata.
    slice_per_1k_usd:
      p.tvl_usd > 0
        ? Math.round(((implied * MODEL.airdropShare * 1000) / p.tvl_usd) * 100) / 100
        : 0,
    age_days: age,
    model: {
      intercept: curve.intercept,
      elasticity: curve.elasticity,
      curve_value_usd: curveValue,
      category_factor: categoryFactor,
      growth_factor: growthFactor,
      maturity_factor: maturityFactor,
      multiple: p.tvl_usd > 0 ? implied / p.tvl_usd : 0,
      peer_count: category ? category.peers : 0,
      basis: category ? 'Curve + category peers' : 'Curve only',
      peers,
      missing: [p.change_7d === null && '7-day growth', age === null && 'Tracking start'].filter(
        Boolean,
      ),
    },
  };
}

// ---- Farm plans -------------------------------------------------------------------------------
// Typical cost of one transaction in USD, by chain. Planning figures, shown as estimates.
const GAS = [
  [/^(Ethereum|Bitcoin|RSK|Stacks|BSquared|Mezo)$/i, 4],
  [/^(Tron)$/i, 1.5],
  [/^(Binance|BSC|Avalanche|Kava|Klaytn|Ronin|Flare)$/i, 0.1],
  [
    /^(Base|Arbitrum|Optimism|OP Mainnet|Unichain|Ink|Linea|Scroll|Blast|Mantle|zkSync Era|Manta|World Chain|Morph|Polygon|Polygon zkEVM|Starknet|Berachain|Monad|Plasma|Katana|Hyperliquid L1|Sonic|Plume Mainnet|Robinhood Chain|Arc|RISE|Pharos|Tempo|Stable|Fluent|Corn)$/i,
    0.05,
  ],
  [/^(Solana|Sui|Aptos|Stellar|Algorand|Ripple|Near|Noble|XION|Provenance|Canton|Proton)$/i, 0.01],
];
const gasOf = (chain) => (GAS.find(([re]) => re.test(chain)) ?? [null, 0.5])[1];
/** The protocol's cheapest listed chain; the first listed chain breaks ties. */
function cheapestChain(chains) {
  if (!chains.length) return { chain: 'its supported chain', gas: 0.5 };
  return chains
    .map((chain) => ({ chain, gas: gasOf(chain) }))
    .reduce((best, c) => (c.gas < best.gas ? c : best));
}

// One playbook per product type: the two real interactions, how much capital a test needs, how many
// transactions it takes and what can go wrong. `match` is tested against the DefiLlama category.
const PLAYBOOKS = [
  {
    match: /Lending|Collateral Markets|Uncollateralized/,
    action: 'Supply',
    capital: 100,
    txs: 5,
    minutes: 40,
    first: (n) =>
      `Open ${n}'s markets and pick the deepest stablecoin market. Note its supply APY, utilisation and available liquidity, then approve and supply the test amount without borrowing.`,
    second: (n) =>
      `Enable the deposit as collateral and borrow at most 20% of it in the same asset family, so the position sits far from liquidation while showing both sides of ${n}'s market.`,
    risk: 'Smart contract, bad-debt and withdrawal-liquidity risk; liquidation if you borrow more',
  },
  {
    match: /CDP|Stablecoin|Anchor BTC|Decentralized BTC/,
    action: 'Mint',
    capital: 150,
    txs: 5,
    minutes: 45,
    first: (n) =>
      `Open a ${n} position: deposit the accepted collateral and mint its stable asset at a collateral ratio at least 50 points above the minimum shown in the app.`,
    second: (n) =>
      `Put the minted asset to work inside ${n}: its savings or stability module if one exists, otherwise hold it. Record the stability fee and the redemption or peg terms.`,
    risk: 'Liquidation, peg and redemption risk',
  },
  {
    match: /Dexs|Liquidity Manager|OTC/,
    action: 'Swap',
    capital: 50,
    txs: 6,
    minutes: 35,
    first: (n) =>
      `Make one small swap on ${n} between two liquid assets. Compare the quoted price impact and fee with a second venue before confirming, and keep slippage at 0.5% or less.`,
    second: (n) =>
      `Add the test amount to ${n}'s deepest stable or correlated pair so impermanent loss stays small. Note the fee tier and how the position is represented (LP token or NFT).`,
    risk: 'Price impact, impermanent loss and pool-contract risk',
  },
  {
    match: /Derivatives|Options|Prediction Market|Interest Rate/,
    action: 'Trade',
    capital: 50,
    txs: 5,
    minutes: 40,
    first: (n) =>
      `Deposit margin on ${n} and read the market's funding, fee and liquidation rules. Open one position at 1x to 2x leverage in the most liquid market, sized to the test amount.`,
    second: (n) =>
      `Close the position after it has paid or received at least one funding or settlement interval, so the account shows a completed round trip on ${n} rather than a single open.`,
    risk: 'Liquidation, funding cost and oracle risk',
  },
  {
    match: /RWA|Payments|Crypto Card|CeDeFi|Insurance/,
    action: 'Subscribe',
    capital: 100,
    txs: 4,
    minutes: 55,
    first: (n) =>
      `Check ${n}'s access rules first: jurisdiction, KYC or accreditation, minimum ticket and redemption window. Complete onboarding only if you qualify; stop here if you do not.`,
    second: (n) =>
      `Subscribe the minimum eligible amount to ${n}'s most liquid product and save the confirmation. Note the redemption notice period and who holds the underlying asset.`,
    risk: 'Eligibility, issuer, custody and redemption-delay risk',
  },
  {
    match: /Basis Trading|Leveraged Farming|Farm|Restaking|Governance Incentives/,
    action: 'Stake',
    capital: 100,
    txs: 5,
    minutes: 40,
    first: (n) =>
      `Deposit the test amount into ${n}'s main strategy. Read where the yield comes from (funding, incentives or leverage) and what the cooldown or unstake delay is.`,
    second: (n) =>
      `Take the receipt token ${n} issues and use it once where the protocol documents an integration; if none exists, simply hold it for the full period.`,
    risk: 'Strategy loss, depeg of the receipt token and unstake delay',
  },
  {
    match: /Chain|Indexes/,
    action: 'Bridge',
    capital: 50,
    txs: 6,
    minutes: 45,
    first: (n) =>
      `Bridge the test amount to ${n} through its canonical bridge and confirm arrival in the explorer. Keep enough of the gas asset for five or six transactions.`,
    second: (n) =>
      `Use two different native applications on ${n} (for example one swap and one deposit) so the wallet shows varied, genuine activity rather than a single transfer.`,
    risk: 'Bridge, sequencer and early-ecosystem contract risk',
  },
  {
    // Curators, allocators, vaults and yield products: the default for deposit-style protocols.
    match: /./,
    action: 'Vault',
    capital: 100,
    txs: 4,
    minutes: 45,
    first: (n) =>
      `Choose one ${n} vault with a stable or blue-chip underlying. Read its curator, fee, underlying markets and withdrawal queue, then approve and deposit the test amount.`,
    second: (n) =>
      `Confirm the vault shares in your wallet and add a second, different ${n} vault with a quarter of the amount, so activity is not a single deposit.`,
    risk: 'Strategy, curator, contract and withdrawal-queue risk',
  },
];
const money2 = (n) => `$${n >= 100 ? Math.round(n) : n.toFixed(2)}`;

export function farmPlan(p, value = {}) {
  const book = PLAYBOOKS.find((b) => b.match.test(p.category ?? ''));
  const { chain, gas } = cheapestChain(p.chains);
  const needsBridge = !/^Ethereum$/i.test(chain) && p.chains.length > 0;
  const bridgeFee = needsBridge ? 1 : 0;
  const repeats = 3; // one follow-up interaction a week for three weeks
  const txs = book.txs + repeats + 2; // + exit and revoke
  const fees = Math.round((txs * gas + bridgeFee) * 100) / 100;
  const minutes = book.minutes + 15 + repeats * 5 + 15;
  const slice = value.slice_per_1k_usd;
  const steps = [
    {
      title: 'Verify before you fund',
      text: `Find ${p.name}'s official site from its own documentation, not a search ad. Confirm it still records no token, that it is live on ${chain}, and whether it runs a points or rewards programme. The snapshot confirms none of these.`,
      cost: 'No transaction',
      time: '15 min',
    },
    {
      title: `Fund a separate wallet on ${chain}`,
      text: `Use a fresh wallet. Send ${money2(book.capital)} of test capital plus about ${money2(Math.max(fees, 0.5))} for fees${needsBridge ? `, bridging to ${chain} if needed (about $1)` : ''}. Never keep more in this wallet than the plan needs.`,
      cost: needsBridge ? `About $1 bridge + ${money2(gas)} gas` : `${money2(gas)} gas`,
      time: '10 min',
    },
    {
      title: `${book.action}: first interaction`,
      text: book.first(p.name),
      cost: `${money2(book.capital)} at work, ${money2(gas * 2)} gas`,
      time: `${Math.round(book.minutes * 0.5)} min`,
    },
    {
      title: 'Second, different interaction',
      text: book.second(p.name),
      cost: `${money2(gas * (book.txs - 2))} gas`,
      time: `${Math.round(book.minutes * 0.5)} min`,
    },
    {
      title: 'Stay active for three weeks',
      text: `Return once a week for ${repeats} weeks and repeat one useful action on ${p.name} (top up, rebalance or claim). Allocation rules that reward usage usually weigh time and repeat activity, not one deposit.`,
      cost: `${money2(gas * repeats)} gas over ${repeats} visits`,
      time: `${repeats * 5} min in total`,
    },
    {
      title: 'Keep a record',
      text: `Save the transaction hashes, dates and amounts for ${p.name}, and note any points balance shown in the app.${slice ? ` At this radar's estimate, $1,000 of TVL would hold about ${money2(slice)} if depositors shared ${MODEL.airdropShare * 100}% of the launch; that is a scenario, not a promise.` : ''}`,
      cost: 'No transaction',
      time: '5 min',
    },
    {
      title: 'Exit and revoke',
      text: `After the period, or at once if the terms change, withdraw from ${p.name} and revoke every token approval you granted. Compare what came back with what went in and decide whether a larger position is justified.`,
      cost: `${money2(gas * 2)} gas, plus any exit fee quoted`,
      time: '10 min',
    },
  ];
  return {
    action: book.action,
    chain,
    txs,
    fees_usd: fees,
    minutes,
    capital_usd: book.capital,
    summary: `${book.action} · ${chain} · ${money2(fees)} fees · ${minutes} min`,
    capital: `${money2(book.capital)} test size`,
    setup_minutes: `${minutes} min`,
    gas_estimate: `${money2(fees)} for ${txs} transactions`,
    risk: book.risk,
    assumption:
      'Fees are planning estimates from typical per-transaction costs on the chosen chain; check the live quote. Eligibility and incentives are not in the snapshot, and no airdrop is assumed.',
    steps,
  };
}

export function buildRadar(snapshot) {
  if (!Array.isArray(snapshot.protocols) || !Array.isArray(snapshot.watchlist))
    throw new Error('Snapshot must include protocols and watchlist arrays.');
  const required = new Set(snapshot.watchlist);
  const curve = fitCurve(snapshot.protocols);
  const candidates = snapshot.protocols.filter((p) => required.has(p.slug) || isCandidate(p));
  const rows = candidates
    .map((p) => {
      const value = valueProtocol(p, snapshot.as_of, curve);
      const farm = farmPlan(p, value);
      return {
        ...p,
        ...value,
        watchlist: required.has(p.slug),
        tier: required.has(p.slug) ? 'Watchlist' : p.tvl_usd >= snapshot.floor_usd ? 'Above floor' : 'Below floor',
        token_status: 'No token recorded',
        farm,
        farm_steps: farm.steps.map(
          (s) => `${s.title}: ${s.text} Cost: ${s.cost}. Time: ${s.time}.`,
        ),
      };
    })
    .sort(
      (a, b) =>
        b.implied_value_usd - a.implied_value_usd ||
        (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0),
    )
    .map((p, i) => ({ ...p, rank: i + 1 }));
  validateBoard(rows, snapshot);
  const live = snapshot.protocols.filter(recordsToken);
  return {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model: MODEL,
    curve: {
      intercept: curve.intercept,
      elasticity: curve.elasticity,
      sigma: curve.sigma,
      low_factor: 10 ** curve.q25,
      high_factor: 10 ** curve.q75,
      comparables: curve.n,
      points: curve.comps.map((c) => [c.tvl_usd, c.mcap_usd, c.name]),
    },
    rows,
    live_count: live.length,
    excluded_count: snapshot.protocols.length - live.length - rows.length,
    universe_count: snapshot.protocols.length,
    watchlist_count: required.size,
    total_tvl: rows.reduce((n, p) => n + p.tvl_usd, 0),
    categories: [...new Set(rows.map((p) => p.category).filter(Boolean))].sort(),
    chains: [...new Set(rows.flatMap((p) => p.chains))].sort(),
  };
}

export function validateBoard(rows, snapshot) {
  const slugs = new Set(snapshot.protocols.map((p) => p.slug));
  const seen = new Set();
  if (rows.length < 100 || rows.length > 4000)
    throw new Error(`Board has ${rows.length} rows; expected 100–4000.`);
  rows.forEach((p, i) => {
    if (!slugs.has(p.slug) || seen.has(p.slug))
      throw new Error(`Invalid or duplicate slug: ${p.slug}`);
    seen.add(p.slug);
    if (
      p.rank !== i + 1 ||
      !Number.isSafeInteger(p.implied_value_usd) ||
      p.implied_value_usd < 1 ||
      p.implied_value_usd > CAP ||
      (i && p.implied_value_usd > rows[i - 1].implied_value_usd)
    )
      throw new Error(`Invalid ranking: ${p.slug}`);
    if (
      !p.name ||
      p.farm_steps.length < 3 ||
      p.farm_steps.length > 12 ||
      p.farm_steps.some((s) => s.trim().length < 20 || s.trim().length > 600)
    )
      throw new Error(`Invalid farm steps: ${p.slug}`);
  });
  if (snapshot.watchlist.some((slug) => !seen.has(slug)))
    throw new Error('Watchlist coverage incomplete.');
  if (new Set(rows.map((p) => p.implied_value_usd)).size === 1)
    throw new Error('All implied values are identical.');
}
export const dataScript = (radar) =>
  `window.__RADAR_DATA__=${JSON.stringify(radar).replaceAll('<', '\\u003c')};\n`;
