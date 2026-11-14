import React, { useState } from 'react';
import { ProtocolMark, Button, Growth, ShareModal } from '../../shared/ui';
import { Icon } from '../../shared/Icon';
import { AnimatedBookmark, SaveButton } from '../../components/ui/SaveButton';
import { OffRadar } from '../../components/ui/OffRadar';
import { ChainMark } from '../../components/ui/ChainMark';
import { ageLabel, money, snapshotDate } from '../../shared/format';
import { ValuationBreakdown } from './components/ValuationBreakdown';
import { FarmPlan } from './components/FarmPlan';
import { ProtocolCharts } from './components/ProtocolCharts';

export function ProtocolPage({
  protocol,
  asOf,
  onBack,
  saved,
  onToggleSave,
  suggestions = [],
  onSelect,
  onSearch,
}) {
  const [shareOpen, setShareOpen] = useState(false);

  if (!protocol) {
    return (
      <div className="page-shell">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <a href="#" onClick={onBack}>
            Explore
          </a>
        </nav>
        <OffRadar
          title="This protocol is off the radar"
          description="Nothing in the sealed snapshot matches this address. It may have a token on record, or sit below the $5M TVL line."
          suggestions={suggestions}
          onSelect={onSelect}
          onBack={onBack}
          onSearch={onSearch}
        />
      </div>
    );
  }
  const isSaved = saved.has(protocol.slug);
  const chains = protocol.chains.length ? protocol.chains : [];
  return (
    <article className="page-shell" aria-label={`${protocol.name} protocol details`}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="#" onClick={onBack}>
          Explore
        </a>
        <Icon name="chevron" size={12} />
        <strong>{protocol.name}</strong>
      </nav>
      <header className="detail-page-header">
        <ProtocolMark name={protocol.name} slug={protocol.slug} size="large" />
        <div className="detail-title">
          <h1>
            {protocol.name}
            <span className="detail-tag">{protocol.category ?? 'Uncategorised'}</span>
          </h1>
        </div>
        <div className="detail-actions">
          <SaveButton
            className="round"
            size={20}
            saved={isSaved}
            label={isSaved ? 'Remove from research list' : 'Save to research list'}
            onClick={() => onToggleSave(protocol.slug)}
          />
          <button
            className="icon-button round"
            onClick={() => setShareOpen(true)}
            aria-haspopup="dialog"
            aria-label="Share"
          >
            <Icon name="share" size={20} />
          </button>
        </div>
      </header>
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={`Share ${protocol.name}`}
        text={`${protocol.name} on Token Radar`}
      />
      <div className="detail-page-grid">
        <div className="detail-page-main">
          <ProtocolCharts key={protocol.slug} protocol={protocol} />
          <section className="detail-block" aria-labelledby="stats-title">
            <h2 id="stats-title">Stats</h2>
            <dl className="stat-grid">
              <div>
                <dt>TVL</dt>
                <dd>{money(protocol.tvl_usd, 2)}</dd>
              </div>
              <div>
                <dt>Implied value</dt>
                <dd>{money(protocol.implied_value_usd, 2)}</dd>
              </div>
              <div>
                <dt>7d TVL change</dt>
                <dd>
                  <Growth value={protocol.change_7d} />
                </dd>
              </div>
              <div>
                <dt>Rank</dt>
                <dd>#{protocol.rank}</dd>
              </div>
              <div>
                <dt>Tracked</dt>
                <dd>{ageLabel(protocol.age_days)}</dd>
              </div>
              <div>
                <dt>Slice per $1k</dt>
                <dd>${protocol.slice_per_1k_usd.toFixed(2)}</dd>
              </div>
            </dl>
          </section>
          <section className="detail-block" aria-labelledby="chains-title">
            <h2 id="chains-title">Chains on record</h2>
            {chains.length ? (
              <ul className="detail-chains" aria-label="Chains recorded in the snapshot">
                {chains.map((chain) => (
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
          <section className="detail-block" aria-labelledby="about-title">
            <h2 id="about-title">About</h2>
            <p className="detail-about">
              {protocol.name} is a {protocol.category ?? 'DeFi'} protocol. The snapshot
              records no token for it, so the figures here are model estimates, not market prices.
            </p>
            <div className="link-pills">
              <span className="pill-link">
                <Icon name="globe" size={16} /> Source: DefiLlama · defillama.com/protocol/
                {protocol.slug}
              </span>
            </div>
          </section>
          <ValuationBreakdown protocol={protocol} />
          <FarmPlan farm={protocol.farm} />
        </div>
        <aside className="detail-page-side" aria-label="Research summary">
          <div className="side-card">
            <div className="side-card-tabs" role="presentation">
              <span className="is-active">Estimate</span>
              <span>{protocol.watchlist ? 'Watchlist' : 'Early discovery'}</span>
            </div>
            <div className="side-panel">
              <span>Implied launch value</span>
              <strong>{money(protocol.implied_value_usd, 2)}</strong>
              <small>
                Range {money(protocol.implied_low_usd)}–{money(protocol.implied_high_usd)} ·{' '}
                {snapshotDate(asOf)}
              </small>
            </div>
            <div className="side-panel">
              <span>Token status</span>
              <strong className="side-status">No token recorded</strong>
              <small className="side-farm">{protocol.farm.summary}</small>
              <small>
                TVL {money(protocol.tvl_usd, 2)} · 7d <Growth value={protocol.change_7d} />
              </small>
            </div>
            <button
              className={`side-cta ${isSaved ? 'is-saved' : ''}`}
              onClick={() => onToggleSave(protocol.slug)}
              aria-pressed={isSaved}
            >
              <AnimatedBookmark saved={isSaved} size={18} />
              {isSaved ? 'Saved to research' : 'Save protocol'}
            </button>
          </div>
          <p className="detail-bottom-note">
            A snapshot is a starting point. Verify current token status and product terms before
            interacting.
          </p>
        </aside>
      </div>
    </article>
  );
}
