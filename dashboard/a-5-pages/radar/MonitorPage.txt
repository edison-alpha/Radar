import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MonitorSkeleton, useReveal } from '../../components/ui/Skeleton';
import { Dropdown } from '../../components/ui/Dropdown';
import { SaveButton } from '../../components/ui/SaveButton';
import { ChainMark } from '../../components/ui/ChainMark';
import { TierBadge } from '../../components/ui/TierBadge';
import { ValuationRange } from '../../components/ui/ValuationRange';
import { ExpandSearch } from '../../components/ui/ExpandSearch';
import { Sparkline } from '../../components/charts/Sparkline';
import { Icon } from '../../shared/Icon';
import { Growth, ProtocolMark } from '../../shared/ui';
import { ageLabel, downloadCsv, money, snapshotDate } from '../../shared/format';
import { InsightsPanel } from './InsightsPanel';
import { useMonitorData } from './useMonitorData';

const TABS = [
  { id: 'all', label: 'All', icon: 'list' },
  { id: 'watchlist', label: 'Watchlist', icon: 'eye' },
  { id: 'early', label: 'Early', icon: 'sparkle' },
  { id: 'gainers', label: 'Gainers', icon: 'trending' },
  { id: 'decliners', label: 'Decliners', icon: 'trendDown' },
];
const PAGE = 25;

function MoverCard({ title, icon, rows, onSelect }) {
  return (
    <section className="monitor-card" aria-label={title}>
      <h2>
        <Icon name={icon} size={18} /> {title}
      </h2>
      <ul>
        {rows.map((p) => (
          <li key={p.slug}>
            <button onClick={() => onSelect(p)}>
              <ProtocolMark name={p.name} slug={p.slug} size="small" />
              <span className="mover-name">{p.name}</span>
              <span className="mover-tvl">{money(p.tvl_usd, 2)}</span>
              <Growth value={p.change_7d} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SortHeader({ id, sort, onSort, children, className }) {
  const active = sort.id === id;
  return (
    <th
      scope="col"
      className={className}
      aria-sort={active ? (sort.desc ? 'descending' : 'ascending') : undefined}
    >
      <button onClick={() => onSort(id)}>
        {children}
        <Icon
          name={active ? 'down' : 'sort'}
          size={12}
          className={active && !sort.desc ? 'rotate-180' : active ? '' : 'sort-icon'}
        />
      </button>
    </th>
  );
}

export function MonitorPage({ data, saved, onToggleSave, onSelect, onBack, onMethodology }) {
  const m = useMonitorData(data);
  const ready = useReveal(380);
  const [tab, setTab] = useState('all');
  const [category, setCategory] = useState('');
  const [chain, setChain] = useState('');
  const [query, setQuery] = useState('');
  const [minTvl, setMinTvl] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [tier, setTier] = useState('');
  const [sort, setSort] = useState({ id: 'implied_value_usd', desc: true });
  const [limit, setLimit] = useState(PAGE);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = m.rows.filter(
      (p) =>
        (!category || p.category === category) &&
        (!chain || p.chains.includes(chain)) &&
        (!tier || p.tier === tier) &&
        (!minTvl || p.tvl_usd >= Number(minTvl)) &&
        (!maxFee || (Number.isFinite(p.farm?.fees_usd) && p.farm.fees_usd <= Number(maxFee))) &&
        (!needle ||
          `${p.name} ${p.slug} ${p.category ?? ''} ${p.chains.join(' ')}`
            .toLowerCase()
            .includes(needle)),
    );
    if (tab === 'watchlist') list = list.filter((p) => p.watchlist);
    if (tab === 'early') list = list.filter((p) => !p.watchlist);
    let key = sort;
    if (tab === 'gainers') {
      list = list.filter((p) => p.change_7d > 0);
      key = { id: 'change_7d', desc: true };
    }
    if (tab === 'decliners') {
      list = list.filter((p) => p.change_7d < 0);
      key = { id: 'change_7d', desc: false };
    }
    const dir = key.desc ? -1 : 1;
    return [...list].sort((a, b) => {
      const av = a[key.id];
      const bv = b[key.id];
      if (av == null && bv == null) return a.rank - b.rank;
      if (av == null) return 1;
      if (bv == null) return -1;
      return dir * (av - bv) || a.rank - b.rank;
    });
  }, [m.rows, tab, category, chain, query, sort, minTvl, maxFee, tier]);

  const counts = useMemo(
    () => ({
      all: m.rows.length,
      watchlist: m.rows.filter((p) => p.watchlist).length,
      early: m.rows.filter((p) => !p.watchlist).length,
      gainers: m.gainers.filter((p) => p.change_7d > 0).length,
      decliners: m.decliners.filter((p) => p.change_7d < 0).length,
    }),
    [m],
  );

  function changeSort(id) {
    setSort((s) => (s.id === id ? { id, desc: !s.desc } : { id, desc: id !== 'rank' }));
    setLimit(PAGE);
  }
  const selectTab = (id) => {
    setTab(id);
    setLimit(PAGE);
  };

  const agg = m.aggregate;
  if (!ready) return <MonitorSkeleton />;
  return (
    <section className="monitor" aria-labelledby="monitor-title">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="#" onClick={onBack}>
          Explore
        </a>
        <Icon name="chevron" size={12} />
        <strong>Radar</strong>
      </nav>
      <div className="monitor-layout">
        <div className="monitor-main">
          <header className="monitor-head">
            <h1 id="monitor-title">Radar</h1>
            <p>
              Track all {data.rows.length} ranked protocols at a glance. TVL trends come from
              DefiLlama history{agg ? ` through ${snapshotDate(agg.end)}` : ''}; implied values come
              from the sealed {snapshotDate(data.as_of)} snapshot.
            </p>
          </header>

          <div className="monitor-cards">
            <section className="monitor-card monitor-total" aria-label="Combined TVL">
              {agg ? (
                <>
                  <div className="monitor-total-top">
                    <div>
                      <strong>{money(agg.total, 2)}</strong>
                      <span>Combined TVL</span>
                    </div>
                    <div>
                      <Growth value={agg.change} />
                      <span>90 days</span>
                    </div>
                  </div>
                  <Sparkline
                    values={agg.points.map((p) => p.value)}
                    width={340}
                    height={110}
                    stretch
                    area
                    label="Combined TVL of ranked protocols over the last 90 days"
                  />
                </>
              ) : (
                <p className="muted">TVL history is not available.</p>
              )}
            </section>
            <MoverCard
              title="Trending up"
              icon="trending"
              rows={m.gainers.slice(0, 5)}
              onSelect={onSelect}
            />
            <MoverCard
              title="Biggest drops"
              icon="trendDown"
              rows={m.decliners.slice(0, 5)}
              onSelect={onSelect}
            />
          </div>
          <div className="monitor-cards monitor-cards-two">
            <section className="monitor-card" aria-label="Categories by TVL">
              <h2>
                <Icon name="category" size={18} /> Categories by TVL
              </h2>
              <ul className="category-bars">
                {m.topCategories.slice(0, 5).map((c) => (
                  <li key={c.name}>
                    <span className="bar-name">{c.name}</span>
                    <span className="bar-track">
                      <i style={{ width: `${(c.tvl / m.topCategories[0].tvl) * 100}%` }} />
                    </span>
                    <span className="bar-value">{money(c.tvl, 2)}</span>
                    <span className="bar-count">{c.count}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="monitor-card" aria-label="Largest slice per $1,000">
              <h2>
                <Icon name="sparkle" size={18} /> {'Largest slice per $1k'}
              </h2>
              <ul>
                {m.bestSlices.map((p) => (
                  <li key={p.slug}>
                    <button onClick={() => onSelect(p)}>
                      <ProtocolMark name={p.name} slug={p.slug} size="small" />
                      <span className="mover-name">{p.name}</span>
                      <span className="mover-tvl">{p.farm.action}</span>
                      <span className="positive">{'$' + p.slice_per_1k_usd.toFixed(2)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
        <aside className="monitor-insights" aria-label="Radar insights">
          <InsightsPanel
            monitor={m}
            saved={saved}
            onSelect={onSelect}
            onMethodology={onMethodology}
          />
        </aside>
      </div>
      <div className="monitor-board">
        <div className="monitor-toolbar">
          <div className="board-tabs monitor-tabs" role="tablist" aria-label="Protocol groups">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => selectTab(t.id)}
              >
                <Icon name={t.icon} size={16} />
                {t.label}
                <span>{counts[t.id]}</span>
                {tab === t.id && (
                  <motion.div
                    className="tab-indicator"
                    layoutId="radar-tab"
                    transition={{ type: 'spring', stiffness: 450, damping: 40 }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="monitor-filters">
            <ExpandSearch
              value={query}
              onChange={(value) => {
                setQuery(value);
                setLimit(PAGE);
              }}
              label="Search the table"
              placeholder="Search protocol, category or chain"
              width={300}
            />
            <Dropdown
              label="Filter by category"
              value={category}
              align="right"
              onChange={(value) => {
                setCategory(value);
                setLimit(PAGE);
              }}
              options={[
                { value: '', label: 'All categories' },
                ...data.categories.map((c) => ({ value: c, label: c })),
              ]}
            />
            <Dropdown
              label="Filter by chain"

              value={chain}

              align="right"

              onChange={(value) => {
                setChain(value);

                setLimit(PAGE);
              }}

              options={[
                { value: '', label: 'All chains' },

                ...data.chains.map((c) => ({ value: c, label: c, chain: c })),
              ]}
            />
            <Dropdown label="Filter by tier" value={tier} onChange={(value) => { setTier(value); setLimit(PAGE); }} options={[
              { value: '', label: 'All tiers' }, { value: 'Watchlist', label: 'Watchlist' },
              { value: 'Above floor', label: 'Above floor' }, { value: 'Below floor', label: 'Below floor' },
            ]} />
            <Dropdown label="Minimum TVL" value={minTvl} onChange={(value) => { setMinTvl(value); setLimit(PAGE); }} options={[
              { value: '', label: 'Any TVL' }, { value: '10000000', label: 'TVL ≥ $10M' },
              { value: '50000000', label: 'TVL ≥ $50M' }, { value: '100000000', label: 'TVL ≥ $100M' },
              { value: '1000000000', label: 'TVL ≥ $1B' },
            ]} />
            <Dropdown label="Maximum estimated farming fees" value={maxFee} onChange={(value) => { setMaxFee(value); setLimit(PAGE); }} options={[
              { value: '', label: 'Any estimated fees' }, { value: '1', label: 'Fees ≤ $1' },
              { value: '5', label: 'Fees ≤ $5' }, { value: '10', label: 'Fees ≤ $10' },
              { value: '50', label: 'Fees ≤ $50' },
            ]} />
            {(query || category || chain || minTvl || maxFee || tier) && (
              <button className="button button-secondary" onClick={() => { setQuery(''); setCategory(''); setChain(''); setMinTvl(''); setMaxFee(''); setTier(''); setLimit(PAGE); }}>Clear filters</button>
            )}
            <button className="button button-secondary monitor-export" onClick={() => downloadCsv(rows, data.as_of)}>Export CSV</button>
          </div>
        </div>

        <div className="table-scroll">
          <table className="monitor-table">
            <caption className="sr-only">
              Ranked protocols with TVL, 7 and 30 day change, implied value and a 90 day trend.
            </caption>
            <thead>
              <tr>
                <th className="col-save" scope="col">
                  <span className="sr-only">Save</span>
                </th>
                <SortHeader id="rank" sort={sort} onSort={changeSort} className="col-num">
                  #
                </SortHeader>
                <th scope="col" className="col-left">
                  Protocol
                </th>
                <th scope="col">Tier</th>
                <SortHeader id="tvl_usd" sort={sort} onSort={changeSort}>
                  TVL
                </SortHeader>
                <SortHeader id="change_7d" sort={sort} onSort={changeSort}>
                  7d
                </SortHeader>
                <SortHeader id="change_30d" sort={sort} onSort={changeSort}>
                  30d
                </SortHeader>
                <SortHeader id="implied_value_usd" sort={sort} onSort={changeSort}>
                  Estimated value
                </SortHeader>
                <SortHeader id="slice_per_1k_usd" sort={sort} onSort={changeSort}>
                  {'Per $1k'}
                </SortHeader>
                <th scope="col">Farm · fees · time</th>
                <SortHeader id="age_days" sort={sort} onSort={changeSort}>
                  Tracked
                </SortHeader>
                <th scope="col" className="col-spark">
                  Last 90 days
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((p, index) => (
                <tr
                  key={`${tab}-${category}-${chain}-${query}-${p.slug}`}
                  className="is-clickable row-in"
                  style={{ '--i': Math.min(index, 14) }}
                  onClick={() => onSelect(p)}
                >
                  <td className="col-save">
                    <SaveButton
                      saved={saved.has(p.slug)}
                      label={`${saved.has(p.slug) ? 'Unsave' : 'Save'} ${p.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleSave(p.slug);
                      }}
                    />
                  </td>
                  <td className="col-num muted">{p.rank}</td>
                  <td className="col-left">
                    <span className="monitor-protocol">
                      <ProtocolMark name={p.name} slug={p.slug} size="small" />
                      <span>
                        <strong>{p.name}</strong>
                        <small>
                          {p.category ?? 'Uncategorised'}
                          {p.chains[0] && (
                            <>
                              {' · '}
                              <ChainMark chain={p.chains[0]} size={13} /> {p.chains[0]}
                              {p.chains.length > 1 ? ` +${p.chains.length - 1}` : ''}
                            </>
                          )}
                        </small>
                      </span>
                    </span>
                  </td>
                  <td><TierBadge tier={p.tier} /></td>
                  <td>{money(p.tvl_usd, 2)}</td>
                  <td>
                    <Growth value={p.change_7d} />
                  </td>
                  <td>
                    <Growth value={p.change_30d} />
                  </td>
                  <td>
                    <ValuationRange value={p.implied_value_usd} low={p.implied_low_usd} high={p.implied_high_usd} />
                  </td>
                  <td>{'$' + p.slice_per_1k_usd.toFixed(2)}</td>
                  <td>
                    <span className="farm-cell">
                      <strong>
                        {p.farm.action} · <ChainMark chain={p.farm.chain} /> {p.farm.chain}
                      </strong>
                      <small>
                        {'$' + p.farm.fees_usd.toFixed(2)} · {p.farm.minutes} min
                      </small>
                    </span>
                  </td>
                  <td className="muted">{ageLabel(p.age_days)}</td>
                  <td className="col-spark">
                    <Sparkline
                      values={p.spark}
                      width={100}
                      height={34}
                      label={`${p.name} TVL, last 90 days`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="monitor-empty">No protocols match these filters.</p>}
        </div>
        <div className="monitor-more">
          <span className="muted">
            Showing {Math.min(limit, rows.length)} of {rows.length}
          </span>
          {limit < rows.length && (
            <button className="button button-secondary" onClick={() => setLimit((n) => n + PAGE)}>
              Show more
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
