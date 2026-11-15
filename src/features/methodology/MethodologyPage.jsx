import React from 'react';
import { CompsChart } from '../../components/charts/CompsChart';
import { BacktestChart } from '../../components/charts/BacktestChart';
import { useViewMode } from '../../shared/useViewMode';
import { ViewToggle } from '../../shared/ViewToggle';
import { snapshotDate } from '../../shared/format';

const pct = (n) => Math.round(n * 100) + '%';
function BacktestRow({ label, result }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{result.n}</td>
      <td className="win">×{result.model.median_miss}</td>
      <td>×{result.flat.median_miss}</td>
      <td className="win">{pct(result.model.within_3x)}</td>
      <td>{pct(result.flat.within_3x)}</td>
      <td className="win">{pct(result.model.within_10x)}</td>
      <td>{pct(result.flat.within_10x)}</td>
      <td>{pct(result.model.inside_band)}</td>
    </tr>
  );
}

export function MethodologyPage({ data, onBack, onSelect }) {
  const { curve, model, backtest, economics } = data;
  const [view, setView] = useViewMode('methodology-view');
  const compact = view === 'compact';
  const backtestSection = backtest && (
      <section id="backtest" className="meth-wide">
        <h3>Backtest: does the curve work on tokens it did not see?</h3>
        <p>
          The {backtest.leave_one_out.n} tokens on record are priced as if they had none. In
          the leave-one-out test each token is removed, the curve and category factors are
          refitted on the rest, and the token is priced from its TVL, category peers and
          seven-day change. In the time split, the curve is fitted on the older listings and
          priced against the newer half, listed from {backtest.time_split.cutoff}. The rival is
          one flat market cap / TVL multiple, the median of the training tokens. Seasoning is
          left out because a token that trades has no days with no token.
        </p>
        <div className="backtest-table-wrap">
          <table className="backtest-table">
            <thead>
              <tr>
                <th scope="col">Test</th>
                <th scope="col">Tokens</th>
                <th scope="col">Median miss, model</th>
                <th scope="col">flat</th>
                <th scope="col">Within 3×, model</th>
                <th scope="col">flat</th>
                <th scope="col">Within 10×, model</th>
                <th scope="col">flat</th>
                <th scope="col">Inside the P25–P75 band</th>
              </tr>
            </thead>
            <tbody>
              <BacktestRow label="Leave one out" result={backtest.leave_one_out} />
              <BacktestRow label="Time split" result={backtest.time_split} />
            </tbody>
          </table>
        </div>
        <BacktestChart points={backtest.points} />
        <p>
          Read it as a ranking tool, not a price: the median token is still off by a factor of
          about {backtest.leave_one_out.model.median_miss}, but the curve misses by less than one
          flat multiple does, and the band holds about half of the tokens, as a middle-half band
          should. Misses are shown as a factor in either direction.
        </p>
      </section>
  );
  return (
    <div className="page-shell">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="#" onClick={onBack}>
          Explore
        </a>
        <span aria-hidden="true">›</span>
        <strong>Methodology</strong>
      </nav>
      <div className={'methodology-content' + (compact ? ' is-compact' : '')}>
        <ViewToggle view={view} onChange={setView} />
        <span className="detail-eyebrow">How a launch is priced</span>
        <h2>Every value is read off the snapshot’s own priced tokens.</h2>
        <p className="methodology-intro">
          One function, priceLaunch in lib/radar.mjs, prices all {data.rows.length} protocols. No
          protocol name is special-cased and nothing is fetched at run time.
        </p>
        <div className="methodology-formula">
          value = 10^{curve.intercept.toFixed(2)} × TVL^{curve.elasticity.toFixed(3)} × category ×
          momentum × seasoning
        </div>
        <CompsChart curve={curve} rows={data.rows} onSelect={onSelect} />
        {compact && backtestSection}
        <div className="meth-sections">
        <section>
          <h3>1. Split the universe</h3>
          <p>
            The DefiLlama snapshot of {snapshotDate(data.as_of)} lists {data.universe_count}{' '}
            protocols with at least $5M of TVL. {data.live_count} record a token (a CoinGecko id, a
            symbol or a market cap): they are never ranked, they are the comparables.{' '}
            {data.excluded_count} more are set aside as wrapped, staked, bridged, exchange or
            versioned products. The remaining {data.rows.length} are ranked, including all{' '}
            {data.watchlist_count} watchlist protocols. “No token recorded” describes the snapshot;
            it is not proof that no token exists.
          </p>
        </section>
        <section>
          <h3>2. Fit the launch curve</h3>
          <p>
            Of the token-recorded protocols, {curve.comparables} have both a market cap and TVL. A
            least-squares line through them in log space gives an elasticity of{' '}
            {curve.elasticity.toFixed(3)}: ten times the TVL has gone with about{' '}
            {(10 ** curve.elasticity).toFixed(1)} times the market cap, not ten. The curve is
            refitted from whatever snapshot the program is given.
          </p>
        </section>
        <section>
          <h3>3. Adjust for category, momentum and seasoning</h3>
          <p>
            Category: the average distance of a category’s priced peers from the curve, each capped
            at ×10 and shrunk toward 1× by {model.categoryShrink} phantom peers, so one or two
            tokens cannot swing a whole category. With no priced peer it is 1×.
          </p>
          <p>
            Momentum = 1 + {model.growthWeight} × seven-day TVL growth, with growth capped at{' '}
            {model.minGrowth}% to +{model.maxGrowth}%; unreported growth is neutral. Seasoning ={' '}
            {model.maturityFloor} + {model.maturityRange} × min(days tracked with no token /{' '}
            {model.maturityDays}, 1), or {model.unknownMaturity} when the start date is missing.
            These two are stated assumptions: the comparables do not show a reliable effect, so they
            are kept small and bounded. Dates use the snapshot date, never the clock.
          </p>
        </section>
        <section>
          <h3>4. Show the uncertainty</h3>
          <p>
            Priced tokens scatter widely around the curve. Half of them sit between ×
            {curve.low_factor.toFixed(2)} and ×{curve.high_factor.toFixed(2)} of it, so every row
            carries that low–high band next to its implied value. The rank uses the central value.
          </p>
        </section>
        {!compact && backtestSection}
        <section>
          <h3>Farm economics: net of all costs</h3>
          <p>
            Each row is priced for a stated capital, {'$' + economics.capital_usd.toLocaleString('en-US')}{' '}
            by default. Slice = implied value × the airdrop share ({economics.share * 100}% by
            default) × capital ÷ TVL, the share depositors would get pro rata. Fees are the plan’s
            transactions × a typical per-transaction cost on the cheapest listed chain. T-bill
            forgone = capital × {economics.tbill_yield * 100}% × {economics.hold_days} days ÷ 365,
            what the same dollars would have earned idle. Net = slice − fees − T-bill; per hour = net
            ÷ the plan’s hands-on hours. Verdict: farm when net is positive, thin when the slice
            beats the fees but not the T-bill yield, skip when the fees eat the slice. Capital,
            airdrop share and hold can be changed on the board and in the plan dialog; one function,
            farmEconomics in lib/economics.mjs, prices them all.
          </p>
        </section>
        <section>
          <h3>Reading the farm plans</h3>
          <p>
            Each plan has seven steps built from the protocol’s category and its cheapest listed
            chain: verify, fund, two different interactions, three monthly follow-ups over the {economics.hold_days}-day hold, record, and
            exit. Fees are transactions × a typical per-transaction cost for that chain; minutes are
            the sum of the steps. “Slice per $1k” is what $1,000 of TVL would hold if depositors
            shared {model.airdropShare * 100}% of the launch pro rata. It is a scenario: the
            snapshot records no points programme, eligibility rule or airdrop.
          </p>
        </section>
        <section>
          <h3>Limits worth knowing</h3>
          <p>
            TVL is not revenue or tokenholder value, and a market cap is not a fully diluted
            valuation. The curve explains only part of the spread, which is why the band is wide.
            Implied values rank research candidates; they do not predict a token, a price or a
            return.
          </p>
          <p className="source-text">Source: {data.source}</p>
        </section>
        </div>
        <div className="methodology-footer">
          Model {model.version} · Sealed snapshot · All processing runs locally
        </div>
      </div>
    </div>
  );
}
