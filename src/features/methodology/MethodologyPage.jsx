import React from 'react';
import { CompsChart } from '../../components/charts/CompsChart';
import { snapshotDate } from '../../shared/format';

export function MethodologyPage({ data, onBack, onSelect }) {
  const { curve, model } = data;
  return (
    <div className="page-shell">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="#" onClick={onBack}>
          Explore
        </a>
        <span aria-hidden="true">›</span>
        <strong>Methodology</strong>
      </nav>
      <div className="methodology-content">
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
        <section>
          <h3>Reading the farm plans</h3>
          <p>
            Each plan has seven steps built from the protocol’s category and its cheapest listed
            chain: verify, fund, two different interactions, three weekly follow-ups, record, and
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
        <div className="methodology-footer">
          Model {model.version} · Sealed snapshot · All processing runs locally
        </div>
      </div>
    </div>
  );
}
