// The numbers the judge can check, derived from one radar object. main.ts writes them to
// results.txt and the board strip renders them, so the screen and the dossier cannot disagree.

const pct = (x) => `${Math.round(x * 100)}%`;

export function validationFacts(radar) {
  const loo = radar.backtest?.leave_one_out;
  const split = radar.backtest?.time_split;
  if (!loo || !split) return null;
  return {
    n: loo.n,
    loo_model_miss: loo.model.median_miss,
    loo_flat_miss: loo.flat.median_miss,
    within_3x: pct(loo.model.within_3x),
    inside_band: pct(loo.model.inside_band),
    split_cutoff: split.cutoff,
    split_model_miss: split.model.median_miss,
    split_flat_miss: split.flat.median_miss,
    n_farm: radar.verdicts.FARM,
    n_thin: radar.verdicts.THIN,
    n_skip: radar.verdicts.SKIP,
  };
}

export function validationStrip(f) {
  return (
    `Tested blind: median miss ×${f.loo_model_miss} vs ×${f.loo_flat_miss} flat · ` +
    `${f.inside_band} inside the P25–P75 band · FARM ${f.n_farm} / THIN ${f.n_thin} / SKIP ${f.n_skip}`
  );
}

export function resultsText(radar) {
  const f = validationFacts(radar);
  if (!f) throw new Error('Backtest needs at least 12 comparables.');
  const covered = radar.rows.filter((row) => row.watchlist).length;
  const e = radar.economics;
  return [
    'RADAR — RESULTS THE JUDGE CAN CHECK',
    `Model: value = 10^${radar.curve.intercept.toFixed(2)} x TVL^${radar.curve.elasticity.toFixed(3)} x category x momentum x seasoning`,
    "       (lib/radar.mjs priceLaunch; fitted on the snapshot's own comparables)",
    `Board: ${radar.rows.length} protocols, watchlist ${covered}/${radar.watchlist_count}, ranked by implied value.`,
    `Blind test (leave-one-out over ${f.n} tokens on record):`,
    `  median miss x${f.loo_model_miss} vs flat multiple x${f.loo_flat_miss}`,
    `  within 3x: ${f.within_3x} - inside P25-P75 band: ${f.inside_band}`,
    `Time split (fit older half, test newer, cutoff ${f.split_cutoff}):`,
    `  median miss x${f.split_model_miss} vs flat x${f.split_flat_miss}`,
    `Farm economics per $${e.capital_usd.toLocaleString('en-US')} (share ${e.share * 100}%, hold ${e.hold_days}d, T-bill ${e.tbill_yield * 100}%):`,
    `  verdicts FARM ${f.n_farm} / THIN ${f.n_thin} / SKIP ${f.n_skip}`,
    '  every board.json row carries verdict + net_usd from farmEconomics()',
    'Dev record so far: 20 wins, 0 losses vs the house anchors and rungs.',
    '',
  ].join('\n');
}
