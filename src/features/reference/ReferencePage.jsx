import React, { useMemo } from 'react';
import { ProtocolMark, Growth } from '../../shared/ui';
import { Icon } from '../../shared/Icon';
import { ChainMark } from '../../components/ui/ChainMark';
import { OffRadar } from '../../components/ui/OffRadar';
import { ageLabel, money, snapshotDate } from '../../shared/format';
import { referenceHref } from '../../shared/useRoute';

const CONFIDENCE = {
  verified: 'matched by CoinGecko id',
  name: 'matched by ticker and name',
  ticker: 'matched by ticker only, unverified',
};

const WHY = {
  'CEX product':
    'A centralised exchange listing is a reserve held by an exchange. There is no protocol behind it that could launch a token.',
  'Bridge product':
    'A bridge locks or wraps another asset to move it between chains. Its TVL is the asset it carries, not a launch to price.',
  'Canonical Bridge product':
    'A canonical bridge is a chain’s own route for an asset. Its TVL belongs to the asset and the chain, not to a separate token.',
  'Cross Chain Bridge product':
    'A cross-chain bridge moves an asset between chains. Its TVL is the asset it carries, not a launch to price.',
  'Liquid Staking product':
    'A liquid staking token is a receipt for a staked asset. It follows the token that already trades, so it is not a fresh launch.',
  'Liquid Restaking product':
    'A restaking receipt wraps a staked asset again. It follows a token that already trades, so it is not a fresh launch.',
  'Restaked BTC product':
    'Restaked BTC wraps Bitcoin. Its value follows the asset underneath, not a token of its own.',
  'Staking Pool product':
    'A staking pool holds a staked asset for depositors. It follows the token that already trades.',
  'Wrapped or staked product':
    'The name marks a wrapped or staked version of an asset that already trades, so it follows that token rather than launching its own.',
  'Versioned product':
    'A version marker (V2, 2.0) in the name means it is a later version of a protocol already tracked, not a separate launch.',
  'Exchange product': 'The name begins with an exchange’s name, so the house rule treats it as that exchange’s product.',
};

/** Where the token's real market cap falls against what the curve alone would have said (log scale). */
function CurveCheck({ low, model, high, actual }) {
  const values = [low, model, high, actual].map(Math.log10);
  const min = Math.min(...values) - 0.3;
  const max = Math.max(...values) + 0.3;
  const at = (v) => `${((Math.log10(v) - min) / (max - min)) * 100}%`;
  const inside = actual >= low && actual <= high;
  return (
    <div className="curve-check">
      <div className="curve-track" role="img" aria-label="Real market cap against the curve's P25 to P75 band">
        <i className="curve-band" style={{ left: at(low), width: `calc(${at(high)} - ${at(low)})` }} />
        <b className="curve-model" style={{ left: at(model) }}>
          <span>Curve says {money(model, 1)}</span>
        </b>
        <b className={`curve-actual ${inside ? 'is-in' : 'is-out'}`} style={{ left: at(actual) }}>
          <span>Real {money(actual, 1)}</span>
        </b>
      </div>
      <p>
        {inside
          ? 'The real market cap sits inside the curve’s middle-half band: the model would have ranked it about right.'
          : 'The real market cap sits outside the curve’s middle-half band: the model would have mispriced it.'}
      </p>
    </div>
  );
}

function PeerList({ title, rows, render }) {
  if (!rows.length) return null;
  return (
    <section className="detail-block">
      <h2>{title}</h2>
      <ul className="reference-peers">{rows.map(render)}</ul>
    </section>
  );
}

/**
 * Detail view for a protocol the board does not rank: a token that already trades (it prices the
 * curve) or a product set aside by the house rule. Every figure comes from the sealed snapshot.
 */
export function ReferencePage({ kind, slug, data, onBack, onSelect, onSelectReference }) {
  const traded = kind === 'token';
  const list = traded ? data.traded : data.set_aside;
  const item = list.find((p) => p.slug === slug);
  const peers = useMemo(() => {
    if (!item) return [];
    return list
      .filter((p) => p.slug !== item.slug && p.category === item.category)
      .sort(
        (a, b) =>
          Math.abs(Math.log10(a.tvl_usd / item.tvl_usd)) - Math.abs(Math.log10(b.tvl_usd / item.tvl_usd)) ||
          (a.slug < b.slug ? -1 : 1),
      )
      .slice(0, 6);
  }, [list, item]);
  const ranked = useMemo(
    () =>
      item
        ? data.rows
            .filter((p) => p.category === item.category)
            .sort((a, b) => b.tvl_usd - a.tvl_usd)
            .slice(0, 5)
        : [],
    [data.rows, item],
  );
  const loo = useMemo(
    () => (item && traded ? data.backtest?.points.find((point) => point[2] === item.name) : null),
    [data.backtest, item, traded],
  );

  if (!item)
    return (
      <div className="page-shell">
        <OffRadar
          title="This protocol is not in the reference lists"
          description="Nothing in the sealed snapshot matches this address."
          suggestions={data.rows.slice(0, 6)}
          onSelect={onSelect}
          onBack={onBack}
        />
      </div>
    );

  const back = (event) => {
    event.preventDefault();
    onBack(event);
  };
  return (
    <article className="page-shell" aria-label={`${item.name} details`}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="#" onClick={back}>
          Explore
        </a>
        <Icon name="chevron" size={12} />
        <span>{traded ? 'Token trades' : 'Set aside'}</span>
        <Icon name="chevron" size={12} />
        <strong>{item.name}</strong>
      </nav>
      <header className="detail-page-header">
        <ProtocolMark name={item.name} slug={item.slug} size="large" />
        <div className="detail-title">
          <h1>
            {item.name}
            <span className="detail-tag">{item.category ?? 'Uncategorised'}</span>
            {traded && item.symbol && <span className="detail-tag">{item.symbol}</span>}
            {!traded && <span className="detail-tag reason-chip">{item.reason}</span>}
          </h1>
        </div>
      </header>
      <div className="detail-page-grid">
        <div className="detail-page-main">
          <section className="detail-block" aria-labelledby="ref-stats">
            <h2 id="ref-stats">Stats</h2>
            <dl className="stat-grid">
              <div>
                <dt>TVL</dt>
                <dd>{money(item.tvl_usd, 2)}</dd>
              </div>
              {traded && (
                <>
                  <div>
                    <dt>Market cap</dt>
                    <dd>{item.mcap_usd > 0 ? money(item.mcap_usd, 2) : 'None in the snapshot'}</dd>
                  </div>
                  <div>
                    <dt>Mcap / TVL</dt>
                    <dd>{item.ratio == null ? 'n/a' : `${item.ratio.toFixed(2)}×`}</dd>
                  </div>
                  {item.mcap_ref && (
                    <div className="stat-wide">
                      <dt>Token market cap, supplementary</dt>
                      <dd>
                        {money(item.mcap_ref.mcap_usd, 2)}
                        <small className="mcap-note">
                          {item.mcap_ref.token} on CoinGecko, {CONFIDENCE[item.mcap_ref.confidence]}, fetched{' '}
                          {item.mcap_ref.as_of}. The snapshot records no market cap for this entry, because the
                          cap belongs to the token as a whole, across every deployment. It is shown for
                          reference and never used by the model.
                        </small>
                      </dd>
                    </div>
                  )}
                </>
              )}
              <div>
                <dt>7d TVL change</dt>
                <dd>
                  <Growth value={item.change_7d} />
                </dd>
              </div>
              <div>
                <dt>Tracked</dt>
                <dd>{ageLabel(item.age_days)}</dd>
              </div>
              <div>
                <dt>{traded ? 'Token on record' : 'Status'}</dt>
                <dd>{traded ? item.symbol ?? item.gecko_id ?? 'Yes' : 'Set aside'}</dd>
              </div>
            </dl>
          </section>

          {traded ? (
            <section className="detail-block" aria-labelledby="ref-curve">
              <h2 id="ref-curve">Against the launch curve</h2>
              {item.model_usd ? (
                <>
                  <CurveCheck low={item.low_usd} model={item.model_usd} high={item.high_usd} actual={item.mcap_usd} />
                  <dl className="stat-grid">
                    <div>
                      <dt>Curve says (in sample)</dt>
                      <dd>{money(item.model_usd, 2)}</dd>
                    </div>
                    <div>
                      <dt>Miss</dt>
                      <dd>×{item.miss.toFixed(1)}</dd>
                    </div>
                    {loo && (
                      <div>
                        <dt>Priced without itself</dt>
                        <dd>
                          {money(loo[0], 2)} · ×{Math.max(loo[0] / loo[1], loo[1] / loo[0]).toFixed(1)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </>
              ) : (
                <p className="detail-about">
                  The snapshot records a token for {item.name} but no market cap, so it cannot be placed on the
                  curve. Its TVL is one deployment, while a token’s market cap covers all of them, so the
                  supplementary figure above is not compared with it.
                </p>
              )}
            </section>
          ) : (
            <section className="detail-block" aria-labelledby="ref-why">
              <h2 id="ref-why">Why it is set aside</h2>
              <p className="detail-about">
                {WHY[item.reason] ?? 'The house rule keeps it off the board.'} This is a rule on the
                kind of product, not a judgment of its quality.
              </p>
            </section>
          )}

          <section className="detail-block" aria-labelledby="ref-chains">
            <h2 id="ref-chains">Chains on record</h2>
            {item.chains.length ? (
              <ul className="detail-chains" aria-label="Chains recorded in the snapshot">
                {item.chains.map((chain) => (
                  <li key={chain}>
                    <ChainMark chain={chain} size={20} />
                    <span>{chain}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detail-about">No chains are recorded in this snapshot.</p>
            )}
          </section>

          <PeerList
            title={traded ? 'Nearest tokens on record by TVL' : 'Others set aside in this category'}
            rows={peers}
            render={(p) => (
              <li key={p.slug}>
                <a
                  href={referenceHref(traded ? 'traded' : 'setaside', p.slug)}
                  onClick={(event) => {
                    event.preventDefault();
                    onSelectReference(traded ? 'traded' : 'setaside', p);
                  }}
                >
                  <ProtocolMark name={p.name} slug={p.slug} size="small" />
                  <span>{p.name}</span>
                  <em>{money(p.tvl_usd, 2)} TVL</em>
                  <strong>{traded ? (p.mcap_usd > 0 ? money(p.mcap_usd, 2) : 'n/a') : p.reason}</strong>
                </a>
              </li>
            )}
          />
        </div>
        <aside className="detail-page-side" aria-label="Why it is not ranked">
          <div className="side-card">
            <div className="side-card-tabs" role="presentation">
              <span className="is-active">{traded ? 'Token on record' : 'Set aside'}</span>
            </div>
            <div className="side-panel">
              <span>{traded ? 'Why it is not ranked' : 'Why it is not ranked'}</span>
              <small className="side-note">
                {traded
                  ? `The snapshot of ${snapshotDate(data.as_of)} records a token for ${item.name}, so it is not a pre-token launch. It is one of the ${data.curve.comparables} tokens the launch curve is fitted on.`
                  : `${item.name} is a ${item.reason.toLowerCase()}, so the house rule keeps it off the board. It is not priced and has no farm plan.`}
              </small>
            </div>
            <div className="side-panel">
              <span>{traded ? 'What a record is, and is not' : 'Closest ranked protocols'}</span>
              {traded ? (
                <small className="side-note">
                  A token on record is the snapshot’s claim, not proof about the token’s health. Check the
                  token’s own channels before relying on it.
                </small>
              ) : (
                <ul className="reference-peers compact">
                  {ranked.length ? (
                    ranked.map((p) => (
                      <li key={p.slug}>
                        <a
                          href={`#/protocol/${p.slug}`}
                          onClick={(event) => {
                            event.preventDefault();
                            onSelect(p);
                          }}
                        >
                          <ProtocolMark name={p.name} slug={p.slug} size="small" />
                          <span>{p.name}</span>
                          <strong>{money(p.implied_value_usd, 1)}</strong>
                        </a>
                      </li>
                    ))
                  ) : (
                    <li className="side-note">No ranked protocol shares this category.</li>
                  )}
                </ul>
              )}
            </div>
            <button type="button" className="side-plan" onClick={back}>
              <Icon name="list" size={16} />
              Back to the board
            </button>
          </div>
          <p className="detail-bottom-note">
            Source: DefiLlama snapshot of {snapshotDate(data.as_of)}. Not financial advice.
          </p>
        </aside>
      </div>
    </article>
  );
}
