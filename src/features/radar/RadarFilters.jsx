import React from 'react';
import { motion } from 'motion/react';
import { Icon } from '../../shared/Icon';
import { Button } from '../../shared/ui';
import { Dropdown } from '../../components/ui/Dropdown';
import { ExpandSearch } from '../../components/ui/ExpandSearch';
export function RadarFilters({
  view,
  onView,
  counts,
  search,
  onSearch,
  category,
  onCategory,
  chain,
  onChain,
  minTvl,
  onMinTvl,
  maxFee,
  onMaxFee,
  tier,
  onTier,
  data,
  onExport,
  reset,
  filtered,
}) {
  const tabs = [
    { id: 'all', label: 'All protocols', icon: 'list', count: counts.all },
    { id: 'watchlist', label: 'Watchlist', icon: 'eye', count: counts.watchlist },
    { id: 'early', label: 'Early discoveries', icon: 'sparkle', count: counts.early },
  ];
  return (
    <>
      <div className="board-tabs" role="tablist" aria-label="Protocol groups">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={view === tab.id}
            onClick={() => onView(tab.id)}
          >
            <Icon name={tab.icon} size={16} />
            {tab.label}
            <span>{tab.count}</span>
            {view === tab.id && (
              <motion.div
                className="tab-indicator"
                layoutId="board-tab"
                transition={{ type: 'spring', stiffness: 450, damping: 40 }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="filter-bar">
        <div className="filter-group filter-group-primary">
        <ExpandSearch label="Search protocols" placeholder="Search protocols…" value={search} onChange={onSearch} width={260} />
        <Dropdown
          label="Filter by category"
          value={category}
          onChange={onCategory}
          options={[
            { value: '', label: 'All categories' },
            ...data.categories.map((c) => ({ value: c, label: c })),
          ]}
        />
        <Dropdown
          label="Filter by chain"
          value={chain}
          onChange={onChain}
          options={[
            { value: '', label: 'All chains' },
            ...data.chains.map((c) => ({ value: c, label: c, chain: c })),
          ]}
        />
        <Dropdown label="Filter by tier" value={tier} onChange={onTier} options={[
          { value: '', label: 'All tiers' },
          { value: 'Watchlist', label: 'Watchlist' },
          { value: 'Above floor', label: 'Above floor' },
          { value: 'Below floor', label: 'Below floor' },
        ]} />
        <Dropdown label="Minimum TVL" value={minTvl} onChange={onMinTvl} options={[
          { value: '', label: 'Any TVL' },
          { value: '10000000', label: 'TVL ≥ $10M' },
          { value: '50000000', label: 'TVL ≥ $50M' },
          { value: '100000000', label: 'TVL ≥ $100M' },
          { value: '1000000000', label: 'TVL ≥ $1B' },
        ]} />
        <Dropdown label="Maximum estimated farming fees" value={maxFee} onChange={onMaxFee} options={[
          { value: '', label: 'Any estimated fees' },
          { value: '1', label: 'Fees ≤ $1' },
          { value: '5', label: 'Fees ≤ $5' },
          { value: '10', label: 'Fees ≤ $10' },
          { value: '50', label: 'Fees ≤ $50' },
        ]} />
        <Button className="export-button" icon="download" onClick={onExport}>
          Export
        </Button>
        </div>
      </div>
      {filtered && (
        <div className="active-filters">
          <span>
            <Icon name="filter" size={14} />
            Filters applied
          </span>
          <button onClick={reset}>
            Clear filters <Icon name="close" size={12} />
          </button>
        </div>
      )}
    </>
  );
}
