import React, { useMemo } from 'react';
import { ProtocolMark, Growth } from '../../shared/ui';
import { Icon } from '../../shared/Icon';
import { money } from '../../shared/format';
export function ResearchSidebar({ data, onSelect, onMethodology }) {
  const momentum = useMemo(
    () =>
      data.rows
        .filter((p) => p.change_7d > 0)
        .sort((a, b) => b.change_7d - a.change_7d)
        .slice(0, 4),
    [data],
  );
  const early = useMemo(() => data.rows.filter((p) => !p.watchlist).slice(0, 3), [data]);
  return (
    <aside className="research-sidebar" aria-label="Research highlights">
      <section className="sidebar-section">
        <div className="sidebar-heading">
          <h3>Gaining momentum</h3>
          <span>7d TVL</span>
        </div>
        <p className="sidebar-description">Growth worth a closer look.</p>
        <div className="momentum-list">
          {momentum.map((p) => (
            <button className="momentum-row" key={p.slug} onClick={() => onSelect(p)}>
              <ProtocolMark name={p.name} slug={p.slug} size="small" />
              <span>
                <strong>{p.name}</strong>
                <small>{p.category ?? 'Uncategorised'}</small>
              </span>
              <Growth value={p.change_7d} />
            </button>
          ))}
        </div>
      </section>
      <section className="research-note">
        <Icon name="info" size={20} />
        <h3>
          Value is a starting point.
          <br />
          Context is the advantage.
        </h3>
        <p>
          Every estimate comes with its assumptions. Open a protocol to see the maths, the missing
          data, and a practical research plan.
        </p>
        <button onClick={onMethodology}>
          Understand the model <Icon name="arrow" size={16} />
        </button>
      </section>
      <section className="sidebar-section early-section">
        <div className="sidebar-heading">
          <h3>Under the surface</h3>
          <span>Early radar</span>
        </div>
        <p className="sidebar-description">Beyond the required watchlist.</p>
        {early.map((p) => (
          <button key={p.slug} className="early-row" onClick={() => onSelect(p)}>
            <span>
              <strong>{p.name}</strong>
              <small>{p.chains[0] ?? 'Chain unreported'}</small>
            </span>
            <span>
              {money(p.implied_value_usd)}
              <Icon name="chevron" size={14} />
            </span>
          </button>
        ))}
      </section>
      <p className="sidebar-footnote">
        {data.live_count} protocols with a token recorded are excluded from these rankings.
      </p>
    </aside>
  );
}
