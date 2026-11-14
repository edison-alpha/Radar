import React from 'react';
import { money, ageLabel } from '../../../shared/format';

/** Shows the exact factors lib/radar.mjs priceLaunch() multiplied for this protocol. */
export function ValuationBreakdown({ protocol }) {
  const { model } = protocol;
  return (
    <section className="detail-section">
      <div className="detail-section-title">
        <h3>Behind the valuation</h3>
        <span>{model.basis}</span>
      </div>
      <div className="valuation-formula">
        <div>
          <span>Curve value at {money(protocol.tvl_usd, 2)} TVL</span>
          <strong>{money(model.curve_value_usd, 2)}</strong>
        </div>
        <span>×</span>
        <div>
          <span>Category</span>
          <strong>{model.category_factor.toFixed(2)}×</strong>
        </div>
        <span>×</span>
        <div>
          <span>Momentum</span>
          <strong>{model.growth_factor.toFixed(2)}×</strong>
        </div>
        <span>×</span>
        <div>
          <span>Seasoning</span>
          <strong>{model.maturity_factor.toFixed(2)}×</strong>
        </div>
      </div>
      <div className="value-range" aria-label="Implied value range">
        <div>
          <span>Low (25th pct.)</span>
          <strong>{money(protocol.implied_low_usd, 2)}</strong>
        </div>
        <div className="is-mid">
          <span>Implied value</span>
          <strong>{money(protocol.implied_value_usd, 2)}</strong>
        </div>
        <div>
          <span>High (75th pct.)</span>
          <strong>{money(protocol.implied_high_usd, 2)}</strong>
        </div>
      </div>
      <p className="detail-explainer">
        Curve: market cap = 10^{model.intercept.toFixed(2)} × TVL^{model.elasticity.toFixed(3)},
        fitted on the snapshot’s token-recorded protocols. Category uses{' '}
        {model.peer_count
          ? `${model.peer_count} ${protocol.category} ${model.peer_count === 1 ? 'peer' : 'peers'}, shrunk toward 1×`
          : 'no priced peers, so it stays at 1×'}
        . Momentum caps seven-day growth at −60% to +100%; seasoning uses{' '}
        {ageLabel(protocol.age_days)} tracked with no token. Half of the priced tokens land inside
        the low–high band.
      </p>
      {model.missing.length > 0 && (
        <p className="data-warning">
          Missing: {model.missing.join(', ')}. Neutral momentum or a 0.85× seasoning fallback is
          applied.
        </p>
      )}
      {model.peers.length > 0 && (
        <div className="peer-list">
          <span>Closest priced {protocol.category} peers by TVL</span>
          {model.peers.map((peer) => (
            <div key={peer.slug}>
              <span>{peer.name}</span>
              <strong>
                {money(peer.mcap_usd, 2)} <small>mcap on {money(peer.tvl_usd, 2)} TVL</small>
              </strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
