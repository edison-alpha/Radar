import React from 'react';
import { Icon } from '../../shared/Icon';
import { number, snapshotDate } from '../../shared/format';

export function Hero({ data, onMethodology }) {
  return (
    <section className="landing" aria-labelledby="hero-title">
      <div className="landing-inner">
        <span className="landing-note">
          <Icon name="sparkle" size={14} /> Pre-token intelligence · Snapshot{' '}
          {snapshotDate(data.as_of)}
        </span>
        <h1 id="hero-title">
          Price the launch
          <br />
          before it happens.
        </h1>
        <p>
          Radar tracks {data.rows.length} protocols with no token on record, estimates what each
          launch could be worth, and shows you how to farm it.
        </p>
        <p className="landing-formula">
          value = 10^{data.curve.intercept.toFixed(2)} × TVL^{data.curve.elasticity.toFixed(3)} ×
          category × momentum × seasoning
        </p>
        <div className="landing-actions">
          <a className="button button-light" href="#protocols">
            Explore the radar <Icon name="arrow" size={16} />
          </a>
          <button className="landing-link" onClick={onMethodology}>
            How it works <Icon name="arrowUp" size={16} />
          </button>
        </div>
        <dl className="landing-stats" aria-label="What the radar covers">
          <div>
            <dt>Ranked by implied value</dt>
            <dd>{data.rows.length}</dd>
            <small>No token recorded in the snapshot</small>
          </div>
          <div>
            <dt>Watchlist covered</dt>
            <dd>
              {data.watchlist_count}
              <em>/{data.watchlist_count}</em>
            </dd>
            <small>
              Every required protocol, plus {data.rows.length - data.watchlist_count} more
            </small>
          </div>
          <div>
            <dt>Token already on record</dt>
            <dd>{number(data.live_count)}</dd>
            <small>Set aside; {data.curve.comparables} of them fit the launch curve</small>
          </div>
          <div>
            <dt>Excluded products</dt>
            <dd>{number(data.excluded_count)}</dd>
            <small>Wrapped, staked, bridged, exchange or versioned</small>
          </div>
        </dl>
      </div>
    </section>
  );
}
